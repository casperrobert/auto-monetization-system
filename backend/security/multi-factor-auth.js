const crypto = require('crypto');
const speakeasy = require('speakeasy');

class MultiFactor {
  constructor() {
    this.challenges = new Map();
    this.biometricHashes = new Map();
    this.deviceTrust = new Map();
  }

  // Level 1: Password + TOTP
  generateTOTP(secret) {
    return speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      time: Math.floor(Date.now() / 1000),
      window: 1
    });
  }

  verifyTOTP(token, secret) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2
    });
  }

  // Level 2: Biometric Challenge
  createBiometricChallenge() {
    const challenge = crypto.randomBytes(32).toString('hex');
    const challengeId = crypto.randomUUID();
    
    this.challenges.set(challengeId, {
      challenge,
      created: Date.now(),
      expires: Date.now() + 300000, // 5 minutes
      type: 'biometric'
    });

    return { challengeId, challenge };
  }

  verifyBiometric(challengeId, biometricHash, deviceId) {
    const challenge = this.challenges.get(challengeId);
    if (!challenge || Date.now() > challenge.expires) {
      return false;
    }

    // Simulate biometric verification
    const expectedHash = crypto
      .createHash('sha256')
      .update(challenge.challenge + deviceId)
      .digest('hex');

    const isValid = biometricHash === expectedHash;
    if (isValid) {
      this.biometricHashes.set(deviceId, biometricHash);
      this.challenges.delete(challengeId);
    }

    return isValid;
  }

  // Level 3: Hardware Token
  generateHardwareChallenge() {
    const challenge = crypto.randomBytes(16).toString('hex');
    const challengeId = crypto.randomUUID();
    
    this.challenges.set(challengeId, {
      challenge,
      created: Date.now(),
      expires: Date.now() + 180000, // 3 minutes
      type: 'hardware'
    });

    return { challengeId, challenge };
  }

  verifyHardwareToken(challengeId, signature, publicKey) {
    const challenge = this.challenges.get(challengeId);
    if (!challenge || Date.now() > challenge.expires) {
      return false;
    }

    try {
      const verify = crypto.createVerify('SHA256');
      verify.update(challenge.challenge);
      const isValid = verify.verify(publicKey, signature, 'hex');
      
      if (isValid) {
        this.challenges.delete(challengeId);
      }
      
      return isValid;
    } catch {
      return false;
    }
  }

  // Level 4: Behavioral Analysis
  analyzeBehavior(deviceId, patterns) {
    const trustScore = this.calculateTrustScore(deviceId, patterns);
    
    this.deviceTrust.set(deviceId, {
      trustScore,
      lastUpdate: Date.now(),
      patterns: patterns
    });

    return trustScore > 0.8; // 80% trust threshold
  }

  calculateTrustScore(deviceId, patterns) {
    const previousTrust = this.deviceTrust.get(deviceId);
    
    if (!previousTrust) {
      return 0.5; // Neutral for new devices
    }

    // Analyze typing patterns, mouse movements, etc.
    let score = previousTrust.trustScore;
    
    // Typing rhythm consistency
    if (patterns.typingRhythm && previousTrust.patterns.typingRhythm) {
      const rhythmSimilarity = this.calculateSimilarity(
        patterns.typingRhythm, 
        previousTrust.patterns.typingRhythm
      );
      score = (score + rhythmSimilarity) / 2;
    }

    // Mouse movement patterns
    if (patterns.mousePattern && previousTrust.patterns.mousePattern) {
      const mouseSimilarity = this.calculateSimilarity(
        patterns.mousePattern,
        previousTrust.patterns.mousePattern
      );
      score = (score + mouseSimilarity) / 2;
    }

    return Math.max(0, Math.min(1, score));
  }

  calculateSimilarity(pattern1, pattern2) {
    // Simplified similarity calculation
    const keys1 = Object.keys(pattern1);
    const keys2 = Object.keys(pattern2);
    const commonKeys = keys1.filter(k => keys2.includes(k));
    
    if (commonKeys.length === 0) return 0;
    
    let similarity = 0;
    commonKeys.forEach(key => {
      const diff = Math.abs(pattern1[key] - pattern2[key]);
      similarity += Math.max(0, 1 - diff);
    });
    
    return similarity / commonKeys.length;
  }

  // Complete MFA verification
  verifyMultiFactor(factors) {
    const {
      password,
      totpToken,
      totpSecret,
      biometricChallengeId,
      biometricHash,
      hardwareChallengeId,
      hardwareSignature,
      hardwarePublicKey,
      deviceId,
      behaviorPatterns
    } = factors;

    const results = {
      level1: false, // Password + TOTP
      level2: false, // Biometric
      level3: false, // Hardware Token
      level4: false, // Behavioral
      overallScore: 0
    };

    // Level 1: Password + TOTP
    if (password === 'secure123' && this.verifyTOTP(totpToken, totpSecret)) {
      results.level1 = true;
      results.overallScore += 25;
    }

    // Level 2: Biometric
    if (biometricChallengeId && this.verifyBiometric(biometricChallengeId, biometricHash, deviceId)) {
      results.level2 = true;
      results.overallScore += 25;
    }

    // Level 3: Hardware Token
    if (hardwareChallengeId && this.verifyHardwareToken(hardwareChallengeId, hardwareSignature, hardwarePublicKey)) {
      results.level3 = true;
      results.overallScore += 25;
    }

    // Level 4: Behavioral Analysis
    if (behaviorPatterns && this.analyzeBehavior(deviceId, behaviorPatterns)) {
      results.level4 = true;
      results.overallScore += 25;
    }

    results.authenticated = results.overallScore >= 75; // Require 3/4 factors
    results.securityLevel = results.overallScore >= 100 ? 'MAXIMUM' : 
                           results.overallScore >= 75 ? 'HIGH' : 
                           results.overallScore >= 50 ? 'MEDIUM' : 'LOW';

    return results;
  }

  generateTOTPSecret() {
    return speakeasy.generateSecret({
      name: 'Casper-AMS Admin',
      issuer: 'Casper-Auto-Monetization-System'
    });
  }

  getDeviceTrust(deviceId) {
    return this.deviceTrust.get(deviceId) || { trustScore: 0 };
  }
}

module.exports = MultiFactor;