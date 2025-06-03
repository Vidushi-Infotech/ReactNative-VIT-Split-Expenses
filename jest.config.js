module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['js', 'jsx', 'json'],
  testMatch: ['**/__tests__/**/*.(js|jsx)', '**/*.(test|spec).(js|jsx)'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
};
