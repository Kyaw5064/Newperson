// Minimal react-native stand-in so App.js can be rendered with react-dom/server in Node.
const React = require('react');

function host(name) {
  const C = function (props) {
    let children = props.children;
    if (typeof children === 'function') children = children({ pressed: false });
    return React.createElement('rn-' + name.toLowerCase(), { 'data-label': props.accessibilityLabel }, children);
  };
  C.displayName = name;
  return C;
}
const View = host('View');
const Text = host('Text');
const ScrollView = host('ScrollView');
const Pressable = host('Pressable');
const Modal = (p) => (p.visible ? React.createElement('rn-modal', null, p.children) : null);
const TextInput = (p) => React.createElement('rn-input', { 'data-value': p.value == null ? '' : String(p.value), 'data-ph': p.placeholder });
const Switch = (p) => React.createElement('rn-switch', { 'data-on': String(!!p.value) });
const ActivityIndicator = () => React.createElement('rn-spinner');
function StatusBar() { return null; }
StatusBar.currentHeight = 24;

function FlatList(p) {
  const el = (c) => (c == null ? null : React.isValidElement(c) ? c : React.createElement(c));
  const items = (p.data || []).map((item, index) =>
    React.createElement(React.Fragment, { key: p.keyExtractor ? p.keyExtractor(item, index) : index }, p.renderItem({ item, index })));
  return React.createElement('rn-flatlist', null, el(p.ListHeaderComponent), items.length ? items : el(p.ListEmptyComponent), el(p.ListFooterComponent));
}

class Value {
  constructor(v) { this.v = v; }
  setValue(v) { this.v = v; }
  interpolate() { return this; }
}
const anim = () => ({ start: (cb) => cb && cb({ finished: true }), stop() {} });
const Animated = {
  Value, View: host('AnimatedView'),
  timing: anim, sequence: anim, loop: anim, delay: anim, spring: anim, parallel: anim,
};
const ident = (x) => x;
const Easing = { out: () => ident, in: () => ident, inOut: () => ident, cubic: ident, quad: ident, linear: ident };

const calls = { alerts: [], links: [], shares: [] };
module.exports = {
  View, Text, TextInput, ScrollView, FlatList, Pressable, Modal, Switch, ActivityIndicator, StatusBar,
  StyleSheet: { create: (s) => s, hairlineWidth: 1 },
  Platform: { OS: 'android', select: (o) => o.android },
  Alert: { alert: (...a) => calls.alerts.push(a) },
  Linking: { openURL: async (u) => { calls.links.push(u); }, canOpenURL: async () => true },
  Share: { share: async (o) => { calls.shares.push(o); return {}; } },
  BackHandler: { addEventListener: () => ({ remove() {} }) },
  Keyboard: { addListener: () => ({ remove() {} }), dismiss() {} },
  AccessibilityInfo: { isReduceMotionEnabled: async () => false },
  Animated, Easing,
  __calls: calls,
};
