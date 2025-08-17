function normalizeIpAddress(ip) {
  if (ip && ip.startsWith("::ffff:")) {
    return ip.substring(7); // Remove '::ffff:'
  }
  return ip;
}

module.exports = normalizeIpAddress;
