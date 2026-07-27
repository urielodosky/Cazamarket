const fs = require('fs');
const path = 'c:/Users/HP/OneDrive/Desktop/CazaMarket/src/components/chat/VirtualAdvisorModal.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/function NestedOptionNode\([^)]+\) \{/, "$&\n  const themeColors = useThemeColors();");
code = code.replace(/export function NestedOptionsBuilder\([^)]+\) \{/, "$&\n  const themeColors = useThemeColors();");
code = code.replace(/function NestedOptionsBuilder\([^)]+\) \{/, "$&\n  const themeColors = useThemeColors();");
code = code.replace(/export default function VirtualAdvisorModal\([^)]+\) \{/, "$&\n  const themeColors = useThemeColors();");

fs.writeFileSync(path, code);
