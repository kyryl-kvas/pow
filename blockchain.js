const crypto = require("crypto");
const fs = require("fs");

/**
 * Check if a given hash (as a Buffer) has at least the specified number
 * of leading zero bits.
 * @param {Buffer} hashBuffer - The SHA256 hash as a Buffer.
 * @param {number} zeros - Required number of leading zero bits.
 * @returns {boolean} - True if condition is met.
 */
function hasLeadingZeroBits(hashBuffer, zeros) {
  let count = 0;
  for (let i = 0; i < hashBuffer.length; i++) {
    const byte = hashBuffer[i];
    for (let bit = 7; bit >= 0; bit--) {
      if (((byte >> bit) & 1) === 0) {
        count++;
        if (count >= zeros) return true;
      } else {
        return count >= zeros;
      }
    }
  }
  return count >= zeros;
}

/**
 * Creates a new block for the given data.
 * The block is found by appending a nonce to the data such that:
 *   SHA256(Data + nonce) has at least "startingZeros" leading zero bits.
 * @param {string} data - The text data for the block.
 * @param {number} startingZeros - The required number of starting zero bits.
 * @returns {object} - The block object containing hash, data, and nonce.
 */
function createBlock(data, startingZeros) {
  let nonce = 0;
  let hash;
  let hashBuffer;

  while (true) {
    const combined = data + nonce;
    hashBuffer = crypto.createHash("sha256").update(combined).digest();
    hash = hashBuffer.toString("hex");
    if (hasLeadingZeroBits(hashBuffer, startingZeros)) {
      console.log(`Found nonce: ${nonce} with hash: ${hash}`);
      break;
    }
    nonce++;
  }

  const block = {
    hash: hash,
    data: data,
    nonce: nonce,
  };
  return block;
}

/**
 * Verifies a block stored in a JSON file.
 * It recalculates the hash from the stored data and nonce, and compares it with the block hash.
 * @param {string} filePath - Path to the file containing the block JSON.
 * @returns {boolean} - True if the block is valid; otherwise false.
 */
function verifyBlock(filePath) {
  try {
    const fileData = fs.readFileSync(filePath, "utf8");
    const block = JSON.parse(fileData);
    const { hash, data, nonce } = block;
    const computedHash = crypto
      .createHash("sha256")
      .update(data + nonce)
      .digest("hex");
    if (computedHash === hash) {
      console.log("Block is valid.");
      return true;
    } else {
      console.log("Block is invalid.");
      return false;
    }
  } catch (err) {
    console.error("Error reading or parsing file:", err);
    return false;
  }
}

const data = "This is a sample block data.";
const startingZeros = 16;

console.log("Creating block...");
const block = createBlock(data, startingZeros);
console.log("Block created:", block);

const filePath = "block.json";
fs.writeFileSync(filePath, JSON.stringify(block, null, 4));
console.log(`Block saved to ${filePath}`);

console.log("Verifying block from file...");
verifyBlock(filePath);
