const fs = require('fs');
const path = 'c:/Users/HP/OneDrive/Desktop/CazaMarket/src/app/mensajes/page.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('useThemeColors')) {
  code = code.replace(/import Link from 'next\/link';/, "import Link from 'next/link';\nimport { useThemeColors } from '@/hooks/useThemeColors';");
  code = code.replace(/export default function MensajesPage\(\) \{/, "export default function MensajesPage() {\n  const themeColors = useThemeColors();");
}

code = code.replace(/background: 'rgba\(0,0,0,0\.2\)'/g, "background: themeColors.bgSubtle2");
code = code.replace(/background: 'rgba\(0,0,0,0\.1\)'/g, "background: themeColors.bgSubtle");
code = code.replace(/background: 'rgba\(0,0,0,0\.4\)'/g, "background: themeColors.bgSubtle3");
code = code.replace(/background: 'rgba\(0,0,0,0\.3\)'/g, "background: themeColors.bgSubtle2");
code = code.replace(/background: 'rgba\(255,255,255,0\.02\)'/g, "background: themeColors.bgSubtle");
code = code.replace(/background: 'rgba\(255,255,255,0\.03\)'/g, "background: themeColors.bgSubtle2");
code = code.replace(/background: 'rgba\(255,255,255,0\.05\)'/g, "background: themeColors.bgSubtle2");
code = code.replace(/background: 'rgba\(255,255,255,0\.1\)'/g, "background: themeColors.bgSubtle3");

fs.writeFileSync(path, code);
