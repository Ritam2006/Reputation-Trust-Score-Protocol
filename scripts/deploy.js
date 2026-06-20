const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const STELLAR_CLI = 'C:\\Program Files (x86)\\Stellar CLI\\stellar.exe';

function runCmd(cmd, options = {}) {
    console.log(`Running: ${cmd}`);
    try {
        return execSync(cmd, { stdio: 'pipe', encoding: 'utf-8', ...options });
    } catch (error) {
        console.error(`Command failed: ${cmd}`);
        if (error.stdout) console.error(`stdout: ${error.stdout}`);
        if (error.stderr) console.error(`stderr: ${error.stderr}`);
        throw error;
    }
}

async function main() {
    console.log("=== Stellar Reputation Protocol Deployment ===");

    // Override environment to prevent Windows file lock / MinGW conflicts
    process.env.PATH = process.env.PATH.split(';').filter(p => !p.toLowerCase().includes('mingw')).join(';');
    process.env.CARGO_TARGET_DIR = 'C:\\Users\\dassh\\.gemini\\antigravity-ide\\scratch\\target_reputation';
    console.log(`Configured CARGO_TARGET_DIR: ${process.env.CARGO_TARGET_DIR}`);

    // 1. Generate/Fund deployer key
    console.log("\n[1/8] Initializing Deployer Key on Testnet...");
    try {
        runCmd(`"${STELLAR_CLI}" keys generate --fund deployer --network testnet`);
    } catch (e) {
        console.log("Deployer key already exists or funded.");
    }

    const deployerAddress = runCmd(`"${STELLAR_CLI}" keys address deployer`).trim();
    console.log(`Deployer Address: ${deployerAddress}`);

    // 2. Build Rust contract
    console.log("\n[2/8] Compiling Soroban Smart Contract to WASM...");
    runCmd(`"${STELLAR_CLI}" contract build`);
    
    const wasmPath = path.join(process.env.CARGO_TARGET_DIR, 'wasm32v1-none', 'release', 'reputation.wasm');
    if (!fs.existsSync(wasmPath)) {
        throw new Error(`WASM file not found at: ${wasmPath}`);
    }
    console.log(`Smart contract built successfully at: ${wasmPath}`);

    // 3. Deploy contract
    console.log("\n[3/8] Deploying contract to Stellar Testnet...");
    const deployOutput = runCmd(`"${STELLAR_CLI}" contract deploy --wasm "${wasmPath}" --source deployer --network testnet`);
    const contractId = deployOutput.trim();
    console.log(`Deployed Contract ID: ${contractId}`);

    // 4. Initialize contract
    console.log("\n[4/8] Initializing Contract with Admin...");
    runCmd(`"${STELLAR_CLI}" contract invoke --id ${contractId} --source deployer --network testnet -- initialize --admin ${deployerAddress}`);
    console.log("Contract initialized successfully!");

    // 5. Generate TS Bindings
    console.log("\n[5/8] Generating TypeScript Bindings...");
    const packagesDir = path.join(__dirname, '..', 'packages');
    if (!fs.existsSync(packagesDir)) {
        fs.mkdirSync(packagesDir, { recursive: true });
    }
    runCmd(`"${STELLAR_CLI}" contract bindings typescript --contract-id ${contractId} --output-dir "${path.join(packagesDir, 'reputation')}" --overwrite`);
    console.log("TS bindings generated in packages/reputation.");

    // 6. Build TS Bindings Package
    console.log("\n[6/8] Building Bindings Package...");
    const bindingsDir = path.join(packagesDir, 'reputation');
    runCmd(`npm install`, { cwd: bindingsDir });
    runCmd(`npm run build`, { cwd: bindingsDir });
    console.log("Bindings package built successfully.");

    // 7. Install bindings package in root Next.js app
    console.log("\n[7/8] Installing Bindings Package in Next.js app...");
    runCmd(`npm install "./packages/reputation"`);
    console.log("Bindings package installed successfully in root package.json!");

    // 8. Create Frontend Config File
    console.log("\n[8/8] Generating Frontend Configuration Files...");
    
    // Write to .env.local
    const envLocalPath = path.join(__dirname, '..', '.env.local');
    const envContent = `NEXT_PUBLIC_REPUTATION_CONTRACT_ID="${contractId}"\nNEXT_PUBLIC_STELLAR_NETWORK="testnet"\nNEXT_PUBLIC_STELLAR_RPC_URL="https://soroban-testnet.stellar.org"\nNEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"\n`;
    fs.writeFileSync(envLocalPath, envContent);
    console.log(`Updated environment variables in .env.local.`);

    // Write a ts client helper
    const clientPath = path.join(__dirname, '..', 'lib', 'reputation-client.ts');
    const clientDir = path.dirname(clientPath);
    if (!fs.existsSync(clientDir)) {
        fs.mkdirSync(clientDir, { recursive: true });
    }
    const clientContent = `import * as Client from 'reputation';

export const contractId = "${contractId}";

export const client = new Client.Client({
  contractId,
  networkPassphrase: "Test SDF Network ; September 2015",
  rpcUrl: "https://soroban-testnet.stellar.org",
});
`;
    fs.writeFileSync(clientPath, clientContent);
    console.log(`Created frontend contract client helper at lib/reputation-client.ts.`);

    console.log("\n=== Deployment and Setup Complete! ===");
}

main().catch(error => {
    console.error("Deployment failed:", error);
    process.exit(1);
});
