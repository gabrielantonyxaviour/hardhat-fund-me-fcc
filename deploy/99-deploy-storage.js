const { getNamedAccounts, deployments, network, ethers } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("----------------------------------------------------")
    log("Deploying FunWithStorage and waiting for confirmations...")
    const funWithStorage = await deploy("FunWithStorage", {
        from: deployer,
        args: [],
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    log("Logging storage...")
    for (let i = 0; i < 10; i++) {
        log(
            `Location ${i}: ${await ethers.provider.getStorageAt(
                funWithStorage.address,
                i
            )}`
        )
    }
    

    // Getting the transaction of the contract deployment
    const trace = await network.provider.send("debug_traceTransaction", [
        funWithStorage.transactionHash,
    ])

    // Logging all the traces where we stored a data in storage variable using "SSTORE"
    for (structLog in trace.structLogs) {
        if (trace.structLogs[structLog].op == "SSTORE") {
            console.log(trace.structLogs[structLog])
        }
    }

    // Finding the keccakhash of the 
    const firstelementLocation = ethers.utils.keccak256(
        "0x0000000000000000000000000000000000000000000000000000000000000002"
    )
    const arrayElement = await ethers.provider.getStorageAt(
        funWithStorage.address,
        firstelementLocation
    )
    log(`Location ${firstelementLocation}: ${arrayElement}`)


    //Array data is located starting at keccak256(p) and it is laid out in the same way as statically-sized 
    // array data would: One element after the other, potentially sharing storage slots if the elements are not longer
    // than 16 bytes. Dynamic arrays of dynamic arrays apply this rule recursively. The location of element x[i][j],
    // where the type of x is uint24[][], is computed as follows (again, assuming x itself is stored at slot p): The
    // slot is keccak256(keccak256(p) + i) + floor(j / floor(256 / 24)) and the element can be obtained from the 
    // slot data v using (v >> ((j % floor(256 / 24)) * 24)) & type(uint24).max.

    
}

module.exports.tags = ["storage"]