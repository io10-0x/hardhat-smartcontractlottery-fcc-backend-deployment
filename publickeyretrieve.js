require("dotenv").config();
const { SigningKey } = require("ethers");
const { ethers } = require("hardhat");
const pkey = process.env.PRIVATE_KEY;

const pkeyencode = ethers.getBytes(pkey);
console.log(pkeyencode);
const signingkey = new SigningKey(pkeyencode);
const publickey = SigningKey.computePublicKey(signingkey.privateKey);
console.log(publickey);
