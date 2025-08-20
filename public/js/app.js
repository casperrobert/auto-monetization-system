cat > public/js/app.js <<'EOF'
console.log('frontend ok', new Date().toISOString());
document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('ts');
  if (el) el.textContent = 'Zeit: ' + new Date().toISOString();
});
EOF

