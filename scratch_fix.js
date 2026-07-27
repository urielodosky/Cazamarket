const fs = require('fs');
const path = 'c:/Users/HP/OneDrive/Desktop/CazaMarket/src/components/chat/VirtualAdvisorModal.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/import CustomSelect from '@\/components\/ui\/CustomSelect';/, "import CustomSelect from '@/components/ui/CustomSelect';\nimport { useThemeColors } from '@/hooks/useThemeColors';");

code = code.replace(/function NestedOptionNode\(\{(.+)\}: any\) \{/, "function NestedOptionNode({$1}: any) {\n  const themeColors = useThemeColors();");

code = code.replace(/export function NestedOptionsBuilder\(\{(.+)\}: any\) \{/, "export function NestedOptionsBuilder({$1}: any) {\n  const themeColors = useThemeColors();");
code = code.replace(/function NestedOptionsBuilder\(\{(.+)\}: any\) \{/, "function NestedOptionsBuilder({$1}: any) {\n  const themeColors = useThemeColors();");

code = code.replace(/export default function VirtualAdvisorModal\(\{(.+)\}: VirtualAdvisorModalProps\) \{/, "export default function VirtualAdvisorModal({$1}: VirtualAdvisorModalProps) {\n  const themeColors = useThemeColors();");

code = code.replace(/background: 'rgba\(0,0,0,0\.3\)'/g, "background: themeColors.bgSubtle2");
code = code.replace(/background: 'rgba\(0,0,0,0\.5\)'/g, "background: themeColors.bgSubtle3");
code = code.replace(/background: '#000'/g, "background: themeColors.bgSubtle3");
code = code.replace(/background: 'rgba\(255,255,255,0\.02\)'/g, "background: themeColors.bgSubtle2");
code = code.replace(/background: 'rgba\(255,255,255,0\.1\)'/g, "background: themeColors.bgSubtle3");
code = code.replace(/borderTop: '1px solid rgba\(255,255,255,0\.05\)'/g, "borderTop: `1px solid ${themeColors.borderSubtle2}`");
code = code.replace(/borderLeft: '2px solid rgba\(255,255,255,0\.1\)'/g, "borderLeft: `2px solid ${themeColors.borderSubtle3}`");
code = code.replace(/background: '#1a1e16'/g, "background: themeColors.surfaceElevated");
code = code.replace(/background: 'rgba\(0,0,0,0\.8\)'/g, "background: 'rgba(0,0,0,0.6)'");

code = code.replace(/color: '#fff', border: '1px solid var\(--color-border\)'/g, "color: themeColors.textWhite, border: '1px solid var(--color-border)'");
code = code.replace(/color: '#fff', fontWeight/g, "color: themeColors.textWhite, fontWeight");
code = code.replace(/color: '#fff', cursor/g, "color: themeColors.textWhite, cursor");
code = code.replace(/color: '#fff', border: 'none'/g, "color: themeColors.textWhite, border: 'none'");
code = code.replace(/color: '#fff'\s*}/g, "color: themeColors.textWhite }");

fs.writeFileSync(path, code);
console.log('Fixed Modal colors');
