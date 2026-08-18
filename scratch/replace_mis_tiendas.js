const fs = require('fs');

const path = 'src/app/mis-tiendas/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const target1 = `<div className="flex flex-col sm:flex-row flex-wrap sm:justify-end items-start sm:items-center mb-6 gap-3">
        <div className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2 sm:py-1.5 rounded-full border" style={{ background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)', borderColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}>
          <span style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.85rem' }}>Plan: {planDisplayName}</span>
        </div>
        <div className="flex items-center justify-between sm:justify-start gap-2 px-4 py-2 sm:py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface-elevated)]">
          <span className="text-[0.85rem] text-[var(--color-text-muted)]">Productos:</span>
          <span className="font-semibold text-[0.85rem]" style={{ color: themeColors.textWhite }}>{myProducts.length} / {permissions.maxProductos === Infinity ? '∞' : permissions.maxProductos}</span>
        </div>
        {permissions.maxServicios > 0 && (
          <div className="flex items-center justify-between sm:justify-start gap-2 px-4 py-2 sm:py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-surface-elevated)]">
            <span className="text-[0.85rem] text-[var(--color-text-muted)]">Servicios:</span>
            <span className="font-semibold text-[0.85rem]" style={{ color: themeColors.textWhite }}>{myServices.length} / {permissions.maxServicios}</span>
          </div>
        )}
      </div>`;

const rep1 = `<div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '9999px', border: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)', background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)' }}>
          <span style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.85rem' }}>Plan: {planDisplayName}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '9999px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface-elevated)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Productos:</span>
          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: themeColors.textWhite }}>{myProducts.length} / {permissions.maxProductos === Infinity ? '∞' : permissions.maxProductos}</span>
        </div>
        {permissions.maxServicios > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '9999px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface-elevated)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Servicios:</span>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: themeColors.textWhite }}>{myServices.length} / {permissions.maxServicios}</span>
          </div>
        )}
      </div>`;

content = content.replace(target1, rep1);

const target2 = `<div className="relative px-5 pb-5" style={{ zIndex: 20 }}>

          {/* Header Info (Avatar & Title) */}
          <div className="flex flex-col items-center md:flex-row md:items-end gap-4 md:gap-8 relative z-10 mb-8 pt-4 md:pt-0">
            {/* Avatar */}
            <div
              className="relative cursor-pointer shrink-0 z-20"
              style={{ marginTop: (isAtLeast(planTier, 'emprendedor') && storeBanner) ? '-60px' : '-40px' }}
              onMouseEnter={() => setIsAvatarHovered(true)}
              onMouseLeave={() => setIsAvatarHovered(false)}
            >
              <div 
                className="w-[96px] h-[96px] md:w-[140px] md:h-[140px] rounded-full border-[4px] md:border-[6px] border-[var(--color-bg-surface)] bg-cover bg-center bg-[var(--color-bg-surface-elevated)] relative shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
                style={{ backgroundImage: \`url(\${avatar || 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=200&auto=format&fit=crop'})\` }}
              >
                {permissions.insigniaVerificada && (
                  <div title="Negocio Verificado" style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'var(--color-bg-surface)', borderRadius: '50%', padding: '4px', display: 'flex', border: '2px solid var(--color-bg-surface)', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--color-primary)" stroke="var(--color-bg-surface)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                  </div>
                )}
              </div>
              {isAvatarHovered && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleAvatarChange}
                  />
                  <EditButton onClick={() => fileInputRef.current?.click()} style={{ bottom: '24px', left: '50%', transform: 'translateX(-50%)', padding: '8px', background: 'rgba(0,0,0,0.8)' }} />
                  <div style={{ position: 'absolute', bottom: '-28px', left: '50%', transform: 'translateX(-50%)', width: '150px', textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', background: 'rgba(0,0,0,0.8)', padding: '4px 8px', borderRadius: '4px', zIndex: 30, pointerEvents: 'none', whiteSpace: 'nowrap' }}>Recomendado: 400x400 px</div>
                </>
              )}
            </div>

            {/* Title & Key Stats */}
            <div className="flex-1 min-w-0 text-center md:text-left">
              <div className="flex flex-col items-center md:items-start">
                {isEditingName ? (
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => {
                      setIsEditingName(false);
                      updateUser({ username: name, avatar });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setIsEditingName(false);
                        updateUser({ username: name, avatar });
                      }
                    }}
                    className="text-2xl md:text-[2.5rem] font-bold mb-3 text-[var(--color-text-main)] bg-[var(--color-bg-surface-elevated)] border border-dashed border-[var(--color-primary)] rounded-[var(--radius-md)] px-3 py-1 w-full outline-none leading-[1.1] text-center md:text-left shadow-sm"
                  />
                ) : (
                  <h1
                    onClick={() => setIsEditingName(true)}
                    className="text-2xl md:text-[2.5rem] font-bold mb-3 text-[var(--color-text-main)] leading-[1.1] cursor-pointer inline-block border-b border-dashed border-[var(--color-border)] text-center md:text-left hover:text-[var(--color-primary)] transition-colors"
                    title="Clic para editar el nombre"
                  >
                    {name}
                  </h1>
                )}
              </div>
            </div>
          </div>`;

const rep2 = `<div style={{ position: 'relative', padding: '0 20px 20px 20px', zIndex: 20 }}>

          {/* Header Info (Avatar & Title) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '24px', position: 'relative', zIndex: 10, marginBottom: '32px' }}>
            {/* Avatar */}
            <div
              style={{ position: 'relative', cursor: 'pointer', flexShrink: 0, zIndex: 20, marginTop: (isAtLeast(planTier, 'emprendedor') && storeBanner) ? '-60px' : '-40px' }}
              onMouseEnter={() => setIsAvatarHovered(true)}
              onMouseLeave={() => setIsAvatarHovered(false)}
            >
              <div 
                style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid var(--color-bg-surface)', backgroundColor: 'var(--color-bg-surface-elevated)', backgroundImage: \`url(\${avatar || 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=200&auto=format&fit=crop'})\`, backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', position: 'relative' }}
              >
                {permissions.insigniaVerificada && (
                  <div title="Negocio Verificado" style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'var(--color-bg-surface)', borderRadius: '50%', padding: '4px', display: 'flex', border: '2px solid var(--color-bg-surface)', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--color-primary)" stroke="var(--color-bg-surface)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                  </div>
                )}
              </div>
              {isAvatarHovered && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleAvatarChange}
                  />
                  <EditButton onClick={() => fileInputRef.current?.click()} style={{ bottom: '24px', left: '50%', transform: 'translateX(-50%)', padding: '8px', background: 'rgba(0,0,0,0.8)' }} />
                  <div style={{ position: 'absolute', bottom: '-28px', left: '50%', transform: 'translateX(-50%)', width: '150px', textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', background: 'rgba(0,0,0,0.8)', padding: '4px 8px', borderRadius: '4px', zIndex: 30, pointerEvents: 'none', whiteSpace: 'nowrap' }}>Recomendado: 400x400 px</div>
                </>
              )}
            </div>

            {/* Title & Key Stats */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                {isEditingName ? (
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => {
                      setIsEditingName(false);
                      updateUser({ username: name, avatar });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setIsEditingName(false);
                        updateUser({ username: name, avatar });
                      }
                    }}
                    style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-main)', background: 'var(--color-bg-surface-elevated)', border: '1px dashed var(--color-primary)', borderRadius: 'var(--radius-md)', padding: '4px 12px', width: '100%', outline: 'none', lineHeight: 1.1, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                  />
                ) : (
                  <h1
                    onClick={() => setIsEditingName(true)}
                    style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-main)', lineHeight: 1.1, cursor: 'pointer', borderBottom: '1px dashed var(--color-border)', transition: 'color 0.2s', display: 'inline-block' }}
                    title="Clic para editar el nombre"
                  >
                    {name}
                  </h1>
                )}
              </div>
            </div>
          </div>`;

content = content.replace(target2, rep2);

const target3 = `<div className="flex flex-col gap-4 mb-10 relative p-4 md:p-6 bg-[var(--color-bg-surface-elevated)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-sm">

            <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-4 relative z-10 w-full">
              <div className="w-full mb-3 sm:mb-0">
                <CustomSelect`;

const rep3 = `<div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px', position: 'relative', padding: '24px', background: 'var(--color-bg-surface-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', position: 'relative', zIndex: 10, width: '100%' }}>
              <div style={{ width: '100%' }}>
                <CustomSelect`;

content = content.replace(target3, rep3);

const target4 = `return (
                  <div key={index} className="w-full mb-3 sm:mb-0">
                    <CustomSelect`;

const rep4 = `return (
                  <div key={index} style={{ width: '100%' }}>
                    <CustomSelect`;

content = content.split(target4).join(rep4);

const target5 = `<textarea
                autoFocus
                value={description}
                onChange={(e) => handleDescChange(e.target.value)}
                onBlur={() => setIsEditingDesc(false)}
                rows={3}
                placeholder="Describe tu negocio en pocas palabras..."
                className="w-full bg-white/5 text-[var(--color-text-main)] text-base md:text-lg leading-relaxed p-3 border border-dashed border-[var(--color-primary)] rounded-[var(--radius-md)] outline-none resize-y"
              />
            ) : (
              <p
                onClick={() => setIsEditingDesc(true)}
                title="Clic para editar la descripción"
                className={\`text-[var(--color-text-muted)] text-base md:text-lg leading-relaxed max-w-[900px] m-0 cursor-pointer border-b border-dashed border-white/20 pb-1 inline-block \${description ? 'opacity-100' : 'opacity-60'}\`}
              >`;

const rep5 = `<textarea
                autoFocus
                value={description}
                onChange={(e) => handleDescChange(e.target.value)}
                onBlur={() => setIsEditingDesc(false)}
                rows={3}
                placeholder="Describe tu negocio en pocas palabras..."
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-main)', fontSize: '1rem', lineHeight: 1.6, padding: '12px', border: '1px dashed var(--color-primary)', borderRadius: 'var(--radius-md)', outline: 'none', resize: 'vertical' }}
              />
            ) : (
              <p
                onClick={() => setIsEditingDesc(true)}
                title="Clic para editar la descripción"
                style={{ color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '900px', margin: 0, cursor: 'pointer', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '4px', display: 'inline-block', opacity: description ? 1 : 0.6 }}
              >`;

content = content.replace(target5, rep5);

fs.writeFileSync(path, content, 'utf8');
console.log('Done replacing Tailwind classes in mis-tiendas/page.tsx');
