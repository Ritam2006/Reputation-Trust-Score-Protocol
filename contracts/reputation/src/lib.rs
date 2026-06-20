#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Symbol, symbol_short};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserProfile {
    pub name: String,
    pub category: String,
    pub metadata_uri: String,
    pub reputation_score: u32, // 0 to 100, default is 50
    pub weighted_sum: u64,     // Sum of (rating * weight)
    pub total_weight: u64,     // Sum of weights
    pub ratings_count: u32,
    pub is_verified: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Rating {
    pub score: u32, // 1 to 5
    pub weight: u64,
    pub comment: String,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    Profile(Address),
    Rating(Address, Address), // (Rater, Ratee)
}

#[contract]
pub struct ReputationContract;

#[contractimpl]
impl ReputationContract {
    // Initialize the contract and set the administrator
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    // Get the administrator address
    pub fn get_admin(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Admin)
    }

    // Create or update a user profile
    pub fn upsert_profile(env: Env, user: Address, name: String, category: String, metadata_uri: String) -> UserProfile {
        user.require_auth();

        let mut profile = match env.storage().persistent().get::<DataKey, UserProfile>(&DataKey::Profile(user.clone())) {
            Some(mut p) => {
                p.name = name.clone();
                p.category = category.clone();
                p.metadata_uri = metadata_uri.clone();
                p
            },
            None => {
                UserProfile {
                    name: name.clone(),
                    category: category.clone(),
                    metadata_uri: metadata_uri.clone(),
                    reputation_score: 50, // default starts at 50
                    weighted_sum: 0,
                    total_weight: 0,
                    ratings_count: 0,
                    is_verified: false,
                }
            }
        };

        env.storage().persistent().set(&DataKey::Profile(user.clone()), &profile);

        // Emit profile update event
        env.events().publish(
            (symbol_short!("prof_upd"), user),
            (name, category, metadata_uri)
        );

        profile
    }

    // Rate another user
    pub fn rate_user(env: Env, rater: Address, ratee: Address, score: u32, comment: String) -> UserProfile {
        rater.require_auth();

        if rater == ratee {
            panic!("Self rating is forbidden");
        }
        if score < 1 || score > 5 {
            panic!("Invalid score, must be between 1 and 5");
        }

        // Get or initialize ratee profile
        let mut ratee_profile = match env.storage().persistent().get::<DataKey, UserProfile>(&DataKey::Profile(ratee.clone())) {
            Some(p) => p,
            None => {
                UserProfile {
                    name: String::from_str(&env, "Anonymous"),
                    category: String::from_str(&env, "General"),
                    metadata_uri: String::from_str(&env, ""),
                    reputation_score: 50,
                    weighted_sum: 0,
                    total_weight: 0,
                    ratings_count: 0,
                    is_verified: false,
                }
            }
        };

        // Determine rater's reputation and weight
        let rater_rep = Self::get_reputation(env.clone(), rater.clone());
        
        // Rater verification status
        let rater_is_verified = match env.storage().persistent().get::<DataKey, UserProfile>(&DataKey::Profile(rater.clone())) {
            Some(p) => p.is_verified,
            None => false,
        };

        // Base weight is the rater's reputation score (starts at 50, goes up to 100)
        let mut rater_weight = rater_rep as u64;
        if rater_is_verified {
            rater_weight = rater_weight * 3; // Verified users have 3x influence
        }

        // Convert the 1-5 star score into a percentage (20 to 100)
        let rating_percent = (score * 20) as u64;

        // Check if there is an existing rating from this rater to this ratee
        let rating_key = DataKey::Rating(rater.clone(), ratee.clone());
        let existing_rating = env.storage().persistent().get::<DataKey, Rating>(&rating_key);

        if let Some(old_rating) = existing_rating {
            // Subtract old rating from cumulative score
            let old_weighted_val = (old_rating.score * 20) as u64 * old_rating.weight;
            if ratee_profile.weighted_sum >= old_weighted_val {
                ratee_profile.weighted_sum -= old_weighted_val;
            } else {
                ratee_profile.weighted_sum = 0;
            }

            if ratee_profile.total_weight >= old_rating.weight {
                ratee_profile.total_weight -= old_rating.weight;
            } else {
                ratee_profile.total_weight = 0;
            }
        } else {
            ratee_profile.ratings_count += 1;
        }

        // Add new rating to cumulative score
        ratee_profile.weighted_sum += rating_percent * rater_weight;
        ratee_profile.total_weight += rater_weight;

        // Recompute the reputation score (0 to 100)
        if ratee_profile.total_weight > 0 {
            ratee_profile.reputation_score = (ratee_profile.weighted_sum / ratee_profile.total_weight) as u32;
        } else {
            ratee_profile.reputation_score = 50;
        }

        // Store the new/updated rating record
        let new_rating = Rating {
            score,
            weight: rater_weight,
            comment: comment.clone(),
            timestamp: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&rating_key, &new_rating);
        env.storage().persistent().set(&DataKey::Profile(ratee.clone()), &ratee_profile);

        // Emit event: (rater, ratee, score, weight, comment)
        env.events().publish(
            (symbol_short!("rate_sub"), rater.clone(), ratee.clone()),
            (score, rater_weight, comment, env.ledger().timestamp())
        );

        ratee_profile
    }

    // Set user verification status (Admin only)
    pub fn verify_user(env: Env, user: Address, verified: bool) -> UserProfile {
        let admin = env.storage().instance().get::<DataKey, Address>(&DataKey::Admin)
            .expect("Contract not initialized");
        admin.require_auth();

        let mut profile = match env.storage().persistent().get::<DataKey, UserProfile>(&DataKey::Profile(user.clone())) {
            Some(p) => p,
            None => {
                UserProfile {
                    name: String::from_str(&env, "Anonymous"),
                    category: String::from_str(&env, "General"),
                    metadata_uri: String::from_str(&env, ""),
                    reputation_score: 50,
                    weighted_sum: 0,
                    total_weight: 0,
                    ratings_count: 0,
                    is_verified: false,
                }
            }
        };

        profile.is_verified = verified;
        env.storage().persistent().set(&DataKey::Profile(user.clone()), &profile);

        // Emit verification event
        env.events().publish(
            (symbol_short!("user_ver"), user),
            verified
        );

        profile
    }

    // Get user profile
    pub fn get_profile(env: Env, user: Address) -> Option<UserProfile> {
        env.storage().persistent().get(&DataKey::Profile(user))
    }

    // Get rating from a specific rater to a ratee
    pub fn get_rating(env: Env, rater: Address, ratee: Address) -> Option<Rating> {
        env.storage().persistent().get(&DataKey::Rating(rater, ratee))
    }

    // Calculate/Retrieve user's reputation score (0 to 100, default is 50)
    pub fn get_reputation(env: Env, user: Address) -> u32 {
        match env.storage().persistent().get::<DataKey, UserProfile>(&DataKey::Profile(user)) {
            Some(p) => p.reputation_score,
            None => 50,
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{Env, Address, String};

    #[test]
    fn test_reputation_protocol() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, ReputationContract);
        let client = ReputationContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let alice = Address::generate(&env);
        let bob = Address::generate(&env);

        client.initialize(&admin);
        assert_eq!(client.get_admin(), Some(admin.clone()));

        // Create profile for Alice
        let profile_alice = client.upsert_profile(
            &alice,
            &String::from_str(&env, "Alice"),
            &String::from_str(&env, "Developer"),
            &String::from_str(&env, "ipfs://alice"),
        );
        assert_eq!(profile_alice.name, String::from_str(&env, "Alice"));
        assert_eq!(profile_alice.reputation_score, 50);

        // Alice rates Bob (Bob doesn't have a profile yet)
        let rating_comment = String::from_str(&env, "Great work!");
        let profile_bob = client.rate_user(&alice, &bob, &5, &rating_comment);
        
        // Bob's reputation score should be 100 (5 stars converted to 100%)
        assert_eq!(profile_bob.reputation_score, 100);
        assert_eq!(profile_bob.ratings_count, 1);

        // Check Bob rating detail
        let rating = client.get_rating(&alice, &bob).unwrap();
        assert_eq!(rating.score, 5);
        assert_eq!(rating.weight, 50);

        // Let's verify Alice's score
        assert_eq!(client.get_reputation(&bob), 100);

        // Bob rates Alice 3 stars (60%). Bob's reputation is 100, so Bob's weight = 100.
        let rating_comment_2 = String::from_str(&env, "Decent developer");
        let profile_alice_updated = client.rate_user(&bob, &alice, &3, &rating_comment_2);
        
        // Alice receives 3 stars (60%) with weight 100. Alice's score becomes 60%
        assert_eq!(profile_alice_updated.reputation_score, 60);

        // Admin verifies Alice
        let profile_alice_verified = client.verify_user(&alice, &true);
        assert_eq!(profile_alice_verified.is_verified, true);

        // Alice rates Bob again, this time with a 2-star rating (40%).
        // Alice is verified, so Alice's weight = her reputation score (60) * 3 = 180.
        // Old rating (score 5, weight 50) is removed, and new rating is added.
        // Bob's new score should be: (40 * 180) / 180 = 40%
        let rating_comment_3 = String::from_str(&env, "Quality dropped");
        let profile_bob_updated = client.rate_user(&alice, &bob, &2, &rating_comment_3);
        assert_eq!(profile_bob_updated.reputation_score, 40);
    }
}
