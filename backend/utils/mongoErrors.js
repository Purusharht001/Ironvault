const isDuplicateKeyError = (err) => err && (err.code === 11000 || err.code === 11001);

module.exports = { isDuplicateKeyError };
