const bcrypt = require("bcrypt");
const saltRounds = 10; // Number of salt rounds for hashing

const hashPassword = async (password) => {
  return await bcrypt.hash(password, saltRounds); // Hash the password with the specified number of salt rounds
};

const comparePasswords = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = { hashPassword, comparePasswords };
