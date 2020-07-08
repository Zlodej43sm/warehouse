module.exports.autoreload = {
  active: false,
  usePolling: false,
  dirs: [
    "api/models",
    "api/controllers",
    "api/services",
    "config/*",
  ],
  ignored: [
    // Ignore all files with .ts extension
    "**.ts"
  ]
};