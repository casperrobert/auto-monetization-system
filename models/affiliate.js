module.exports.simulate = async (params) => ({
  source: "affiliate",
  daily: Math.random() * 100,
  monthly: Math.random() * 3000,
  yearly: Math.random() * 36000,
  risk: "Mittel",
  invest: params.startCapital * 0.1
});
