const FloatingShape = ({ color, size, top, left, delay }) => {
  return (
    <div
      className={`absolute rounded-full ${color} ${size} animate-float`}
      style={{
        top,
        left,
        animationDelay: `${delay}s`,
        opacity: 0.6,
      }}
    />
  );
};

export default FloatingShape;