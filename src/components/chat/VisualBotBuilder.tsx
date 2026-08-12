'use client';

import React, { useCallback, useMemo, useState, forwardRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
  BackgroundVariant,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { AdvisorOption, AdvisorRule, GotoOption } from './VirtualAdvisorModal';

// ─── Custom Node: Bot Message ──────────────────────────────────────────
function BotMessageNode({ data, id, selected }: NodeProps) {
  const d = data as any;
  const text: string = d.text || '';
  const options: { id: string; label: string; conditionType?: string; conditionValue?: string }[] = d.options || [];
  const isRoot: boolean = d.isRoot || false;
  const nodeType: string = d.nodeType || 'message'; // 'message' | 'whatsapp' | 'file' | 'goto'

  const headerColors: Record<string, string> = {
    message: 'var(--color-primary)',
    whatsapp: '#25d366',
    file: '#3498db',
    goto: '#9b59b6',
  };

  const headerLabels: Record<string, string> = {
    message: 'Mensaje del Bot',
    whatsapp: 'Derivar a WhatsApp',
    file: 'Archivo Adjunto',
    goto: 'Derivar a Regla',
  };

  const buttonOptions = options.filter(o => !o.conditionType && o.label !== '__next__');
  const textOptions = options.filter(o => o.conditionType);

  return (
    <div style={{
      background: 'var(--color-bg, #1a1a1a)',
      border: `2px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
      borderRadius: '12px',
      width: '280px',
      boxShadow: selected ? '0 0 0 2px rgba(255,115,0,0.3)' : '0 4px 12px rgba(0,0,0,0.2)',
      overflow: 'visible',
      fontFamily: 'var(--font-inter, sans-serif)',
    }}>
      {/* Target Handle (Input) */}
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: 'var(--color-primary)', width: '16px', height: '16px', left: '-8px', border: '2px solid #fff', zIndex: 10 }}
        />
      )}

      {/* Header */}
      <div style={{
        background: headerColors[nodeType] || 'var(--color-primary)',
        padding: '8px 12px',
        color: '#fff',
        fontSize: '0.85rem',
        fontWeight: 600,
        borderRadius: '10px 10px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>{headerLabels[nodeType] || 'Nodo'}</span>
        {!isRoot && (
          <button
            className="nodrag"
            onClick={() => d.onDeleteNode?.(id)}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >x</button>
        )}
      </div>

      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Main text area */}
        {nodeType !== 'goto' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'grab' }}>
              {nodeType === 'whatsapp' ? 'Texto pre-llenado de WA' : (nodeType === 'file' || nodeType === 'file_options') ? 'Nombre del Archivo' : 'Texto de respuesta'}
            </label>
            <textarea
              className="nodrag nopan"
              value={text}
              onChange={(e) => d.onTextChange?.(id, e.target.value)}
              placeholder={nodeType === 'whatsapp' ? 'Hola, me interesa...' : (nodeType === 'file' || nodeType === 'file_options') ? 'catalogo.pdf' : 'Ej: Hola, en que te ayudo?'}
              rows={(nodeType === 'file' || nodeType === 'file_options') ? 1 : 3}
              style={{
                width: '100%', padding: '8px',
                background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-main, #fff)',
                border: '1px solid var(--color-border)', borderRadius: '6px',
                resize: 'none', fontSize: '0.82rem', fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          </div>
        )}

        {/* Goto selector */}
        {nodeType === 'goto' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Derivar a
            </label>
            <select
              className="nodrag nopan"
              value={d.gotoTarget || ''}
              onChange={(e) => d.onGotoChange?.(id, e.target.value)}
              style={{
                width: '100%', padding: '8px',
                background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-main, #fff)',
                border: '1px solid var(--color-border)', borderRadius: '6px',
                fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none',
              }}
            >
              <option value="" style={{ background: '#1a1a1a', color: '#fff' }}>Seleccionar destino...</option>
              {(d.gotoOptions || []).map((go: GotoOption) => (
                <option key={go.value} value={go.value} style={{ background: '#1a1a1a', color: '#fff' }}>{go.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* File upload indicator */}
        {(nodeType === 'file' || nodeType === 'file_options') && (
          <div style={{ padding: '8px', background: 'rgba(74,144,217,0.1)', borderRadius: '6px', fontSize: '0.8rem', color: '#4a90d9', textAlign: 'center' }}>
            El archivo se configura al guardar la regla
          </div>
        )}

        {/* Unified message options/conditions */}
        {nodeType === 'message' && (
          <>
            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '2px 0' }} />
            
            {/* Buttons Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Opciones (Botones)
              </label>
              {buttonOptions.map((opt, index) => (
                <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
                  <input
                    className="nodrag nopan"
                    type="text"
                    value={opt.label}
                    onChange={(e) => d.onOptionLabelChange?.(id, opt.id, e.target.value)}
                    placeholder={`Boton ${index + 1}`}
                    style={{
                      flex: 1, padding: '5px 8px', fontSize: '0.78rem',
                      background: 'rgba(0,0,0,0.2)', color: 'var(--color-primary)',
                      border: '1px solid var(--color-primary)', borderRadius: '16px',
                      outline: 'none', textAlign: 'center',
                    }}
                  />
                  <button
                    className="nodrag"
                    onClick={() => d.onOptionRemove?.(id, opt.id)}
                    style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '2px', fontSize: '1rem', lineHeight: 1 }}
                  >x</button>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={opt.id}
                    style={{ background: 'var(--color-primary)', width: '16px', height: '16px', right: '-8px', top: 'auto', border: '2px solid #fff', zIndex: 10 }}
                  />
                </div>
              ))}
              <button
                className="nodrag"
                onClick={() => d.onOptionAdd?.(id)}
                style={{
                  background: 'rgba(255,255,255,0.03)', color: 'var(--color-primary)',
                  border: '1px dashed var(--color-border)', padding: '5px',
                  borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', marginTop: '2px',
                }}
              >+ Agregar Botón</button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '4px 0' }} />

            {/* Text Conditions Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Condiciones de Texto Libre
              </label>
              {textOptions.map((opt, index) => (
                <div key={opt.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,0,0,0.25)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      className="nodrag nopan"
                      value={opt.conditionType || 'exact'}
                      onChange={(e) => d.onOptionPropChange?.(id, opt.id, 'conditionType', e.target.value)}
                      style={{ flex: 1, padding: '6px 8px', fontSize: '0.75rem', background: '#222', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="exact">Exacto</option>
                      <option value="keyword">Contiene</option>
                      <option value="always">Fallback</option>
                    </select>
                    <button className="nodrag" onClick={() => d.onOptionRemove?.(id, opt.id)} style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', color: '#ff4444', cursor: 'pointer', width: '24px', height: '24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold' }}>✕</button>
                  </div>
                  {opt.conditionType !== 'always' && (
                    <input
                      className="nodrag nopan"
                      type="text"
                      value={opt.conditionValue || ''}
                      onChange={(e) => {
                        d.onOptionPropChange?.(id, opt.id, 'conditionValue', e.target.value);
                        d.onOptionLabelChange?.(id, opt.id, e.target.value); // Keep label in sync for debugging
                      }}
                      placeholder="Valor esperado"
                      style={{ width: '100%', padding: '6px 8px', fontSize: '0.75rem', background: 'rgba(0,0,0,0.4)', color: 'var(--color-text-main, #fff)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', outline: 'none' }}
                    />
                  )}
                  <Handle type="source" position={Position.Right} id={opt.id} style={{ background: 'var(--color-primary)', width: '16px', height: '16px', right: '-16px', top: '50%', transform: 'translateY(-50%)', border: '2px solid #fff', zIndex: 10 }} />
                </div>
              ))}
              <button
                className="nodrag"
                onClick={() => d.onOptionAdd?.(id, { conditionType: 'exact', conditionValue: '' })}
                style={{ background: 'rgba(255,255,255,0.03)', color: '#e74c3c', border: '1px dashed rgba(231,76,60,0.5)', padding: '5px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', marginTop: '2px' }}
              >+ Agregar Condición Textual</button>
            </div>
          </>
        )}

        {/* Source handle for sequential nodes (message, file) */}
        {(nodeType === 'message' || nodeType === 'file') && (
          <>
            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', position: 'relative', paddingRight: '12px' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>Siguiente Paso ⤵</span>
              <Handle
                type="source"
                position={Position.Right}
                id="__next__"
                style={{ background: '#7f8c8d', width: '14px', height: '14px', right: '-7px', top: 'auto', border: '2px solid #fff', zIndex: 10 }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Converters: AdvisorOption[] <-> Nodes/Edges ───────────────────────

function optionsToGraph(
  rootText: string,
  rootOptions: AdvisorOption[],
  rootResponseType: string,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let yOffset = 0;

  const rootId = 'root';
  const rootNodeOptions = rootOptions.map(opt => ({ id: opt.id, label: opt.label, conditionType: opt.conditionType, conditionValue: opt.conditionValue }));
  
  let rootNodeType: string = rootResponseType || 'message';
  if (['text', 'options', 'input'].includes(rootNodeType)) rootNodeType = 'message';

  nodes.push({
    id: rootId,
    type: 'botMessage',
    position: { x: 50, y: 80 },
    data: { text: rootText, options: rootNodeOptions, isRoot: true, nodeType: rootNodeType },
  });

  const traverse = (opts: AdvisorOption[], parentId: string, depth: number, startY: number) => {
    opts.forEach((opt, idx) => {
      const nodeId = opt.id;
      const x = 50 + depth * 380;
      const y = startY + idx * 250;

      let nodeType: string = opt.responseType || 'message';
      if (['text', 'options', 'input'].includes(nodeType)) nodeType = 'message';

      const childOptions = (opt.options || []).map(sub => ({ id: sub.id, label: sub.label, conditionType: sub.conditionType, conditionValue: sub.conditionValue }));

      nodes.push({
        id: nodeId,
        type: 'botMessage',
        position: { x, y },
        data: {
          text: opt.responseType === 'goto' ? '' : ((opt.responseType === 'file') ? (opt.fileName || opt.responseText || '') : opt.responseText),
          options: childOptions,
          isRoot: false,
          nodeType,
          gotoTarget: opt.gotoId || '',
          fileName: opt.fileName || '',
        },
      });

      let sourceHandleId = opt.id;
      if (opt.label === '__next__') {
        sourceHandleId = '__next__';
      }

      edges.push({
        id: `e-${parentId}-${opt.id}`,
        source: parentId,
        sourceHandle: sourceHandleId,
        target: nodeId,
        animated: true,
        style: { stroke: 'var(--color-primary)', strokeWidth: 2 },
      });

      if (opt.options && opt.options.length > 0 && nodeType !== 'goto') {
        traverse(opt.options, nodeId, depth + 1, y);
      }
    });
  };

  if (rootOptions.length > 0) {
    traverse(rootOptions, rootId, 1, 80);
  }

  return { nodes, edges };
}

function graphToOptions(
  nodes: Node[],
  edges: Edge[],
): { text: string; options: AdvisorOption[]; rootType: string; rootFile?: string; rootWhatsapp?: string; rootGoto?: string } {
  const rootNode = nodes.find(n => (n.data as any).isRoot);
  if (!rootNode) return { text: '', options: [], rootType: 'options' };

  const rootData = rootNode.data as any;

  const buildChildren = (parentId: string, parentOptions: { id: string; label: string; conditionType?: any; conditionValue?: any }[]): AdvisorOption[] => {
    return parentOptions.map(optHandle => {
      const edge = edges.find(e => e.source === parentId && e.sourceHandle === optHandle.id);
      const childNode = edge ? nodes.find(n => n.id === edge.target) : null;

      if (!childNode) {
        return {
          id: optHandle.id,
          label: optHandle.label,
          responseType: 'text' as const,
          responseText: '',
          conditionType: optHandle.conditionType,
          conditionValue: optHandle.conditionValue,
        };
      }

      const childData = childNode.data as any;
      const childNodeType = childData.nodeType || 'message';
      const childOptions = childData.options || [];

      let responseType: AdvisorOption['responseType'] = (childNodeType as AdvisorOption['responseType']) || 'text';
      // Auto-correct unified message types
      if (childNodeType === 'message') {
        const hasConditions = childOptions.some((o: any) => o.conditionType);
        const hasButtons = childOptions.some((o: any) => !o.conditionType && o.label !== '__next__');
        if (hasConditions) responseType = 'input';
        else if (hasButtons) responseType = 'options';
        else responseType = 'text';
      }

      const result: AdvisorOption = {
        id: optHandle.id,
        label: optHandle.label,
        responseType,
        responseText: (childNodeType === 'file') ? '' : (childData.text || ''),
        fileName: (childNodeType === 'file') ? (childData.text || childData.fileName || '') : undefined,
        whatsappText: childNodeType === 'whatsapp' ? (childData.text || '') : undefined,
        gotoId: childNodeType === 'goto' ? (childData.gotoTarget || '') : undefined,
        conditionType: optHandle.conditionType,
        conditionValue: optHandle.conditionValue,
      };

      if (childOptions.length > 0 && childNodeType !== 'goto' && childNodeType !== 'whatsapp') {
        result.options = buildChildren(childNode.id, childOptions);
      }

      if ((childNodeType === 'message' || childNodeType === 'file') && childNodeType !== 'whatsapp' && childNodeType !== 'goto') {
        const nextEdge = edges.find(e => e.source === childNode.id && e.sourceHandle === '__next__');
        if (nextEdge) {
          const nextChildren = buildChildren(childNode.id, [{ id: nextEdge.target, label: '__next__' }]);
          if (nextChildren.length > 0) {
            result.options = nextChildren;
          }
        }
      }

      return result;
    });
  };

  const resultOptions = buildChildren(rootNode.id, rootData.options || []);
  
  const rootNodeType = rootData.nodeType || 'options';
  let rootType = rootNodeType;
  // Root node also can have a __next__ edge if it's message or file
  if ((rootNodeType === 'message' || rootNodeType === 'file') && rootNodeType !== 'whatsapp' && rootNodeType !== 'goto') {
    const nextEdge = edges.find(e => e.source === rootNode.id && e.sourceHandle === '__next__');
    if (nextEdge && resultOptions.length === 0) {
      const nextChildren = buildChildren(rootNode.id, [{ id: nextEdge.target, label: '__next__' }]);
      if (nextChildren.length > 0) {
        resultOptions.push(...nextChildren);
      }
    }
  }

  // Auto-correct unified message types
  if (rootNodeType === 'message') {
    const hasConditions = resultOptions.some((o: any) => o.conditionType);
    const hasButtons = resultOptions.some((o: any) => !o.conditionType && o.label !== '__next__');
    if (hasConditions) rootType = 'input';
    else if (hasButtons) rootType = 'options';
    else rootType = 'text';
  }

  return { 
    text: (rootNodeType === 'file') ? '' : (rootData.text || ''), 
    options: resultOptions,
    rootType,
    rootFile: (rootNodeType === 'file') ? (rootData.text || rootData.fileName || '') : undefined,
    rootWhatsapp: rootNodeType === 'whatsapp' ? (rootData.text || '') : undefined,
    rootGoto: rootNodeType === 'goto' ? (rootData.gotoTarget || '') : undefined,
  };
}

// ─── Main Visual Builder Component ─────────────────────────────────────

interface VisualBotBuilderProps {
  responseText: string;
  options: AdvisorOption[];
  responseType: string;
  onChange: (text: string, options: AdvisorOption[], rootType: string, rootFile?: string, rootWhatsapp?: string, rootGoto?: string) => void;
  allRules: AdvisorRule[];
  editingRuleId: string | null;
}

const VisualBotBuilder = forwardRef((props: VisualBotBuilderProps, ref) => {
  const { responseText, options, responseType, onChange, allRules, editingRuleId } = props;
  const nodeTypes: NodeTypes = useMemo(() => ({ botMessage: BotMessageNode }), []);

  const initial = useMemo(() => optionsToGraph(responseText, options, responseType), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);

  // Build goto options
  const gotoOptions = useMemo(() => {
    const gotos: GotoOption[] = [{ value: 'root', label: 'Volver al inicio de esta regla' }];
    allRules.forEach(r => {
      if (r.id !== editingRuleId) {
        let label = '';
        if (r.conditionType === 'always') label = 'Siempre (Menu Principal)';
        else if (r.conditionType === 'exact') label = `Exacto: "${r.conditionValue}"`;
        else if (r.conditionType === 'keyword') label = `Palabra Clave: "${r.conditionValue}"`;
        if (label) gotos.push({ value: `rule_${r.id}`, label: `Ir a -> Regla ${label}` });
      }
    });
    return gotos;
  }, [allRules, editingRuleId]);

  // Sync back to parent on every change
  const syncToParent = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    const result = graphToOptions(currentNodes, currentEdges);
    onChange(result.text, result.options, result.rootType, result.rootFile, result.rootWhatsapp, result.rootGoto);
  }, [onChange]);

  const updateNodeData = useCallback((nodeId: string, updates: Record<string, any>) => {
    setNodes(nds => {
      const updated = nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n);
      setTimeout(() => syncToParent(updated, edges), 0);
      return updated;
    });
  }, [setNodes, edges, syncToParent]);

  // Callback handlers passed into nodes
  const onTextChange = useCallback((nodeId: string, text: string) => {
    updateNodeData(nodeId, { text });
  }, [updateNodeData]);

  const onOptionAdd = useCallback((nodeId: string, extraProps?: any) => {
    const newOptId = `opt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setNodes(nds => {
      const updated = nds.map(n => {
        if (n.id === nodeId) {
          const currentOpts = ((n.data as any).options || []) as { id: string; label: string }[];
          return { ...n, data: { ...n.data, options: [...currentOpts, { id: newOptId, label: '', ...extraProps }] } };
        }
        return n;
      });
      setTimeout(() => syncToParent(updated, edges), 0);
      return updated;
    });
  }, [setNodes, edges, syncToParent]);

  const onOptionPropChange = useCallback((nodeId: string, optId: string, prop: string, value: any) => {
    setNodes(nds => {
      const updated = nds.map(n => {
        if (n.id === nodeId) {
          const opts = ((n.data as any).options || []).map((o: any) => o.id === optId ? { ...o, [prop]: value } : o);
          return { ...n, data: { ...n.data, options: opts } };
        }
        return n;
      });
      setTimeout(() => syncToParent(updated, edges), 0);
      return updated;
    });
  }, [setNodes, edges, syncToParent]);

  const onOptionLabelChange = useCallback((nodeId: string, optId: string, label: string) => {
    setNodes(nds => {
      const updated = nds.map(n => {
        if (n.id === nodeId) {
          const opts = ((n.data as any).options || []).map((o: any) => o.id === optId ? { ...o, label } : o);
          return { ...n, data: { ...n.data, options: opts } };
        }
        return n;
      });
      setTimeout(() => syncToParent(updated, edges), 0);
      return updated;
    });
  }, [setNodes, edges, syncToParent]);

  const onOptionRemove = useCallback((nodeId: string, optId: string) => {
    setNodes(nds => {
      const updated = nds.map(n => {
        if (n.id === nodeId) {
          const opts = ((n.data as any).options || []).filter((o: any) => o.id !== optId);
          return { ...n, data: { ...n.data, options: opts } };
        }
        return n;
      });
      setEdges(eds => eds.filter(e => !(e.source === nodeId && e.sourceHandle === optId)));
      setTimeout(() => {
        const cleanedEdges = edges.filter(e => !(e.source === nodeId && e.sourceHandle === optId));
        syncToParent(updated, cleanedEdges);
      }, 0);
      return updated;
    });
  }, [setNodes, setEdges, edges, syncToParent]);

  const onDeleteNode = useCallback((nodeId: string) => {
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  const onGotoChange = useCallback((nodeId: string, value: string) => {
    updateNodeData(nodeId, { gotoTarget: value });
  }, [updateNodeData]);

  const onChangeNodeType = useCallback((nodeId: string, type: string) => {
    updateNodeData(nodeId, { nodeType: type });
  }, [updateNodeData]);

  // Inject callbacks into all nodes
  const nodesWithCallbacks = useMemo(() => {
    return nodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        onTextChange,
        onOptionAdd,
        onOptionPropChange,
        onOptionLabelChange,
        onOptionRemove,
        onDeleteNode,
        onGotoChange,
        onChangeNodeType,
        gotoOptions,
      },
    }));
  }, [nodes, onTextChange, onOptionAdd, onOptionPropChange, onOptionLabelChange, onOptionRemove, onDeleteNode, onGotoChange, onChangeNodeType, gotoOptions]);

  const onConnect = useCallback((connection: Connection) => {
    setEdges(eds => {
      const newEdges = addEdge({ ...connection, animated: true, style: { stroke: 'var(--color-primary)', strokeWidth: 2 } }, eds);
      setTimeout(() => syncToParent(nodes, newEdges), 0);
      return newEdges;
    });
  }, [setEdges, nodes, syncToParent]);

  // Toolbar: add new node
  const addNewNode = useCallback((type: 'message' | 'whatsapp' | 'file' | 'goto') => {
    const newId = `node_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newNode: Node = {
      id: newId,
      type: 'botMessage',
      position: { x: Math.random() * 300 + 200, y: Math.random() * 200 + 100 },
      data: { text: '', options: [], isRoot: false, nodeType: type, gotoTarget: '' },
    };
    setNodes(nds => [...nds, newNode]);
  }, [setNodes]);

  React.useImperativeHandle(ref, () => ({
    addNewNode
  }));

  return (
    <div style={{ width: '100%', height: '550px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)', position: 'relative' }}>
      {/* Toolbar */}
      <div style={{
        position: 'absolute', top: '12px', left: '12px', zIndex: 10,
        display: 'none', gap: '8px', flexWrap: 'wrap',
      }}>
        <button onClick={() => addNewNode('message')} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
          + Mensaje
        </button>
        <button onClick={() => addNewNode('file')} style={{ background: '#4a90d9', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
          + Archivo
        </button>
        <button onClick={() => addNewNode('whatsapp')} style={{ background: '#25d366', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
          + WhatsApp
        </button>
        <button onClick={() => addNewNode('goto')} style={{ background: '#9b59b6', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
          + Derivar
        </button>
      </div>

      <ReactFlow
        nodes={nodesWithCallbacks}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        style={{ background: 'var(--color-bg, #111)' }}
        defaultEdgeOptions={{ animated: true, style: { stroke: 'var(--color-primary)', strokeWidth: 2 } }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.05)" />
        <Controls style={{ background: 'var(--color-bg, #1a1a1a)', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
        <MiniMap
          nodeStrokeColor="var(--color-primary)"
          nodeColor="var(--color-bg, #1a1a1a)"
          maskColor="rgba(0,0,0,0.7)"
          style={{ background: 'var(--color-bg, #111)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
        />
      </ReactFlow>
    </div>
  );
});

export default VisualBotBuilder;
