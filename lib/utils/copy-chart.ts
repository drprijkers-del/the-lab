'use client'

/**
 * Copy a chart element to clipboard with PulseLabs branding
 * Includes logo, team name, tier, and the chart itself
 */

interface CopyChartOptions {
  chartElement: HTMLElement
  teamName: string
  tier?: string
  chartTitle?: string
}

export async function copyChartWithBranding({
  chartElement,
  teamName,
  tier,
  chartTitle,
}: CopyChartOptions): Promise<void> {
  // Dynamically import html2canvas only when needed
  const html2canvas = (await import('html2canvas')).default

  // Create a wrapper div with branding
  const wrapper = document.createElement('div')
  wrapper.style.cssText = `
    background: white;
    padding: 32px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    width: fit-content;
    border-radius: 12px;
  `

  // Header with logo and team info
  const header = document.createElement('div')
  header.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid #f5f5f4;
  `

  // Logo + PulseLabs text
  const logoSection = document.createElement('div')
  logoSection.style.cssText = 'display: flex; align-items: center; gap: 12px;'
  logoSection.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" style="width: 32px; height: 32px;">
      <circle cx="32" cy="32" r="28" stroke="url(#rippleGradient)" stroke-width="2" fill="none" opacity="0.3" />
      <circle cx="32" cy="32" r="20" stroke="url(#rippleGradient)" stroke-width="2.5" fill="none" opacity="0.5" />
      <circle cx="32" cy="32" r="12" stroke="url(#rippleGradient)" stroke-width="3" fill="none" opacity="0.75" />
      <circle cx="32" cy="32" r="5" fill="url(#dropGradient)" />
      <defs>
        <linearGradient id="dropGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ec4899" />
          <stop offset="100%" stop-color="#a855f7" />
        </linearGradient>
        <linearGradient id="rippleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ec4899" />
          <stop offset="100%" stop-color="#a855f7" />
        </linearGradient>
      </defs>
    </svg>
    <span style="font-size: 20px; font-weight: 700; background: linear-gradient(135deg, #ec4899, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">PulseLabs</span>
  `

  // Team info
  const teamInfo = document.createElement('div')
  teamInfo.style.cssText = 'text-align: right;'
  const tierText = tier ? ` · ${tier.replace('_', ' ')}` : ''
  teamInfo.innerHTML = `
    <div style="font-size: 16px; font-weight: 600; color: #292524;">${teamName}${tierText}</div>
    ${chartTitle ? `<div style="font-size: 14px; color: #78716c; margin-top: 4px;">${chartTitle}</div>` : ''}
  `

  header.appendChild(logoSection)
  header.appendChild(teamInfo)

  // Clone the chart element to avoid modifying the original
  const chartClone = chartElement.cloneNode(true) as HTMLElement
  chartClone.style.cssText = `
    background: white;
    border-radius: 8px;
    padding: 16px;
  `

  // Assemble
  wrapper.appendChild(header)
  wrapper.appendChild(chartClone)

  // Temporarily add to DOM (required for html2canvas)
  wrapper.style.position = 'absolute'
  wrapper.style.left = '-9999px'
  wrapper.style.top = '-9999px'
  document.body.appendChild(wrapper)

  try {
    // Convert to canvas
    const canvas = await html2canvas(wrapper, {
      backgroundColor: '#ffffff',
      scale: 2, // High DPI for crisp PowerPoint images
      logging: false,
    })

    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png')
    })

    // Copy to clipboard
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ])
  } finally {
    // Clean up
    document.body.removeChild(wrapper)
  }
}
