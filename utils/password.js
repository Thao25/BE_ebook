const bcrypt = require("bcryptjs");

const hashPassword = (plainPassword, saltRounds = 10) =>
  bcrypt.hash(plainPassword, saltRounds);

const comparePassword = (plainPassword, hashedPassword) =>
  bcrypt.compare(plainPassword, hashedPassword);

module.exports = {
  hashPassword,
  comparePassword,
};

