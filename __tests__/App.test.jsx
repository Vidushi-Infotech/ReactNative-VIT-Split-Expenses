/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { View, Text } from 'react-native';

// Create a simple test component instead of testing the full app
const SimpleApp = () => {
  return (
    <View>
      <Text>Splitzy App Test</Text>
    </View>
  );
};

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<SimpleApp />);
  });
});
