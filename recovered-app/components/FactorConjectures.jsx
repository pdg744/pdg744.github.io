import { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/theme.js';
import { conjectureEdgeKey, conjectureText, groupConjectureConnections } from '../game/factorConjectures.js';

const categories = [['examples', 'Examples'], ['counterexamples', 'Counterexamples'], ['unsorted', 'Unsorted']];

function DraggableResult({ edge, category, number, measureZones, targetAt, onHover, onDrop, onDrag }) {
  const offset = useRef(new Animated.ValueXY()).current;
  const [dragging, setDragging] = useState(false);
  const dragActive = useRef(false);
  const latest = useRef(null);
  latest.current = { category, measureZones, targetAt, onHover, onDrop, onDrag };
  useEffect(() => () => {
    if (dragActive.current) latest.current.onDrag(null);
  }, []);
  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      dragActive.current = true;
      latest.current.measureZones();
      setDragging(true);
      latest.current.onDrag(latest.current.category);
    },
    onPanResponderMove: (_, gesture) => {
      offset.setValue({ x: gesture.dx, y: gesture.dy });
      latest.current.onHover(latest.current.targetAt(gesture.moveX, gesture.moveY));
    },
    onPanResponderRelease: (_, gesture) => {
      const target = latest.current.targetAt(gesture.moveX, gesture.moveY);
      offset.setValue({ x: 0, y: 0 });
      dragActive.current = false;
      setDragging(false);
      latest.current.onHover(null);
      latest.current.onDrag(null);
      if (target && target !== latest.current.category) latest.current.onDrop(target);
    },
    onPanResponderTerminate: () => {
      offset.setValue({ x: 0, y: 0 });
      dragActive.current = false;
      setDragging(false);
      latest.current.onHover(null);
      latest.current.onDrag(null);
    },
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
  })).current;
  const keyProps = Platform.OS === 'web' ? {
    tabIndex: 0,
    onKeyDown: (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const index = categories.findIndex(([key]) => key === category);
      onDrop(categories[(index + (event.key === 'ArrowRight' ? 1 : 2)) % 3][0]);
    },
  } : {};
  return (
    <Animated.View {...responder.panHandlers} {...keyProps} accessible accessibilityRole="button"
      accessibilityLabel={`${edge.from} to ${edge.to}, ${category}, Conjecture ${number}`}
      accessibilityHint="Drag to a category. With a keyboard, use left or right arrow to move."
      accessibilityActions={categories.filter(([key]) => key !== category).map(([name, label]) => ({ name, label: `Move to ${label}` }))}
      onAccessibilityAction={(event) => onDrop(event.nativeEvent.actionName)}
      style={[styles.result, dragging && styles.dragging, { transform: offset.getTranslateTransform() }]}>
      <Text selectable={false} style={styles.statement}>{edge.from} → {edge.to}</Text>
    </Animated.View>
  );
}

function ConjectureCard({ conjecture, connections, onChange, onDragChange }) {
  const [hover, setHover] = useState(null);
  const [dragSource, setDragSource] = useState(null);
  const zoneRefs = useRef({});
  const bounds = useRef({});
  const groups = groupConjectureConnections(conjecture, connections);
  const number = conjecture.kind === 'size' ? 1 : 2;
  function measureZones() {
    bounds.current = {};
    for (const [key] of categories) {
      zoneRefs.current[key]?.measureInWindow((x, y, width, height) => {
        bounds.current[key] = { x, y, width, height };
      });
    }
  }
  function targetAt(pageX, pageY) {
    const x = pageX - (Platform.OS === 'web' ? window.scrollX : 0);
    const y = pageY - (Platform.OS === 'web' ? window.scrollY : 0);
    return categories.find(([key]) => {
      const box = bounds.current[key];
      return box && x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
    })?.[0] ?? null;
  }
  function classify(edge, group) {
    if (!categories.some(([key]) => key === group)) return;
    const classifications = { ...conjecture.classifications };
    const key = conjectureEdgeKey(edge);
    if (group === 'unsorted') delete classifications[key];
    else classifications[key] = group;
    onChange({ ...conjecture, classifications });
  }
  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.heading}>Conjecture {number}</Text>
      <Text style={styles.statement}>{conjectureText(conjecture)}</Text>
      <View style={styles.zones}>
        {categories.map(([key, label]) => (
          <View key={key} ref={(node) => { zoneRefs.current[key] = node; }} onLayout={measureZones}
            style={[styles.zone, hover === key && styles.active, dragSource === key && styles.source]}>
            <Text style={styles.zoneLabel}>{label} ({groups[key].length})</Text>
            <View style={styles.row}>
              {groups[key].map((edge) => (
                <DraggableResult key={conjectureEdgeKey(edge)} edge={edge} category={key} number={number}
                  measureZones={measureZones} targetAt={targetAt} onHover={setHover} onDrag={(source) => {
                    setDragSource(source);
                    onDragChange(source !== null);
                  }}
                  onDrop={(group) => classify(edge, group)} />
              ))}
              {!groups[key].length && <Text style={styles.empty}>Drop here</Text>}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function FactorConjectures({ conjectures, connections, onChange, onDragChange }) {
  return (
    <View style={styles.container}>
      {!conjectures.length && <Text style={styles.empty}>Collect a result to start investigating conjectures.</Text>}
      {conjectures.map((conjecture) => (
        <ConjectureCard key={conjecture.kind} conjecture={conjecture} connections={connections} onDragChange={onDragChange}
          onChange={(updated) => onChange(conjectures.map((item) => item.kind === updated.kind ? updated : item))} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 600, marginTop: 4 },
  heading: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  card: { backgroundColor: Colors.surface, borderRadius: 12, padding: 12, marginBottom: 8, gap: 10 },
  statement: { color: Colors.textPrimary, fontSize: 15, lineHeight: 21 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  zones: { gap: 10 },
  zone: { minHeight: 94, padding: 10, gap: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.textSecondary, borderRadius: 10 },
  zoneLabel: { color: Colors.textSecondary, fontSize: 14 },
  source: { zIndex: 10 },
  result: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: Colors.teal, backgroundColor: Colors.background, ...Platform.select({ web: { touchAction: 'none', cursor: 'grab', userSelect: 'none' } }) },
  dragging: { zIndex: 20, elevation: 8, opacity: 0.9, ...Platform.select({ web: { cursor: 'grabbing' } }) },
  active: { borderColor: Colors.teal },
  empty: { color: Colors.textSecondary, fontSize: 14, paddingVertical: 12 },
});
