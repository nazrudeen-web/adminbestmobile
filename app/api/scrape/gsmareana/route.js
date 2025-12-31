import { NextResponse } from 'next/server'
import axios from 'axios'
import * as cheerio from 'cheerio'

// Map GSMArena spec names to our database structure
const SPEC_MAPPING = {
  // Network & Connectivity
  'Technology': { group: 'Network', name: 'Network Technology' },
  'Network': { group: 'Network', name: 'Network Technology' }, // collapse to one field
  
  // Launch & Status
  'Announced': { group: 'Launch', name: 'Announced' },
  'Status': { group: 'Launch', name: 'Status' },
  
  // Body & Design
  'Dimensions': { group: 'Design', name: 'Dimensions' },
  'Weight': { group: 'Design', name: 'Weight' },
  'Build': { group: 'Design', name: 'Build Materials' },
  'SIM': { group: 'Design', name: 'SIM Type' },
  'Water Resistance': { group: 'Design', name: 'Water Resistance' },
  'Colors': { group: 'Design', name: 'Colors' },
  'Models': { group: 'Design', name: 'Model Numbers' },
  
  // Display
  'Type': { group: 'Display', name: 'Display Type' },
  'Size': { group: 'Display', name: 'Display Size' },
  'Display Size': { group: 'Display', name: 'Display Size' },
  'Display Type': { group: 'Display', name: 'Display Type' },
  'Resolution': { group: 'Display', name: 'Resolution' },
  'Ratio': { group: 'Display', name: 'Aspect Ratio' },
  'Density': { group: 'Display', name: 'Pixel Density' },
  'Refresh Rate': { group: 'Display', name: 'Refresh Rate' },
  'Protection': { group: 'Display', name: 'Glass Protection' },
  'Brightness': { group: 'Display', name: 'Brightness' },
  'HDR': { group: 'Display', name: 'HDR Support' },
  'Refresh rate': { group: 'Display', name: 'Refresh Rate' },
  
  // Platform & OS
  'OS': { group: 'Platform', name: 'Operating System' },
  'Upgrades': { group: 'Platform', name: 'Android Upgrades' },
  'UI': { group: 'Platform', name: 'Custom UI' },
  
  // Performance
  'Chipset': { group: 'Performance', name: 'Processor' },
  'CPU': { group: 'Performance', name: 'CPU' },
  'GPU': { group: 'Performance', name: 'GPU' },
  'RAM': { group: 'Performance', name: 'RAM' },
  'Storage': { group: 'Performance', name: 'Storage' },
  'Card Slot': { group: 'Performance', name: 'Card Slot' },
  'Internal': { group: 'Performance', name: 'Storage Options' },
  'Processor': { group: 'Performance', name: 'Processor' },
  
  // Camera
  'Main Camera': { group: 'Camera', name: 'Main Camera' },
  'Triple': { group: 'Camera', name: 'Back Camera Setup' },
  'Features': { group: 'Camera', name: 'Camera Features' },
  'Video': { group: 'Camera', name: 'Video Recording' },
  'Front Camera': { group: 'Camera', name: 'Front Camera' },
  'Selfie camera': { group: 'Camera', name: 'Front Camera' },
  'Single': { group: 'Camera', name: 'Front Camera Setup' },
  'Dual': { group: 'Camera', name: 'Back Camera Setup' },
  'Quad': { group: 'Camera', name: 'Back Camera Setup' },
  
  // Audio & Communication
  'Loudspeaker': { group: 'Audio', name: 'Loudspeaker' },
  '3.5mm jack': { group: 'Audio', name: '3.5mm Jack' },
  'WLAN': { group: 'Connectivity', name: 'WiFi' },
  'Bluetooth': { group: 'Connectivity', name: 'Bluetooth' },
  'Positioning': { group: 'Connectivity', name: 'GPS' },
  'NFC': { group: 'Connectivity', name: 'NFC' },
  'Radio': { group: 'Connectivity', name: 'FM Radio' },
  'USB': { group: 'Connectivity', name: 'USB' },
  'Sensors': { group: 'Features', name: 'Sensors' },
  
  // Battery
  'Battery Type': { group: 'Battery', name: 'Battery Type' },
  'Capacity': { group: 'Battery', name: 'Battery Capacity' },
  'Charging': { group: 'Battery', name: 'Charging' },
  'Wireless Charging': { group: 'Battery', name: 'Wireless Charging' },
  'Battery Capacity': { group: 'Battery', name: 'Battery Capacity' },
  'Fast Charging': { group: 'Battery', name: 'Charging' },
  
  // Tests & Measurements
  'Performance': { group: 'Tests', name: 'Performance Benchmarks' },
  'Display': { group: 'Tests', name: 'Display Quality' },
  'Loudspeaker': { group: 'Tests', name: 'Speaker Quality' },
  'Battery': { group: 'Tests', name: 'Battery Endurance' },
  'Repairability': { group: 'Tests', name: 'Repairability' },
  
  // Misc
  'SAR': { group: 'Safety', name: 'SAR Rating' }
}

async function searchGSMArena(phoneName) {
  try {
    // Search GSMArena using new API endpoint
    const searchUrl = `https://www.gsmarena.com/results.php3?sSearch=${encodeURIComponent(phoneName)}`
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.gsmarena.com/'
      },
      timeout: 15000
    })

    const $ = cheerio.load(response.data)
    const results = []
    const seen = new Set()

    // IMPORTANT: GSMArena search results page includes navigation links that we must filter out
    // Navigation items like "News", "Reviews", "Videos", "Featured" should NOT be returned
    // Phone models typically appear in URL patterns like /brand_model-digits.php
    
    $('a').each((i, elem) => {
      const link = $(elem).attr('href') || ''
      const text = $(elem).text().trim()
      
      // Must have both href and text
      if (!link || !text || seen.has(link)) return
      
      // Text length validation
      if (text.length < 3 || text.length > 150) return
      
      // Link must be a PHP page (phone pages are .php files)
      if (!link.includes('.php') || link.includes('javascript:')) return
      
      // Explicitly filter out known navigation pages
      const lowerLink = link.toLowerCase()
      const lowerText = text.toLowerCase()
      
      // Check URL for navigation keywords
      const navKeywords = ['news', 'reviews', 'videos', 'featured', 'search', 'glossary', 'tools', 'makers', 'calendar', 'news.php', 'reviews.php']
      for (const keyword of navKeywords) {
        if (lowerLink.includes(keyword)) return
      }
      
      // Check text for standalone navigation words (must be exact or in multi-word)
      if (lowerText === 'news' || lowerText === 'reviews' || lowerText === 'videos' || lowerText === 'featured' || lowerText === 'help' || lowerText === 'about') return
      
      // URL pattern check: phone pages typically have underscores and dashes in them
      // Example: /apple_iphone_16_pro-12345.php
      const hasPhoneUrlPattern = link.match(/_[a-z0-9_]+-\d+\.php/i) !== null
      
      // Brand/model keyword check for text
      const phoneKeywords = ['iphone', 'samsung', 'xiaomi', 'pixel', 'oneplus', 'huawei', 'realme', 'poco', 'redmi', 'motorola', 'nokia', 'honor', 'oppo', 'vivo', 'sony', 'htc', 'lg', 'asus']
      const hasPhoneBrand = phoneKeywords.some(brand => lowerText.includes(brand))
      
      // Model pattern - numbers or special model names
      const modelPattern = /\d{3,4}\s*|pro\s|max\s|ultra\s|plus\s|mini\s|fold|flip|note\s|edge|s\d+|a\d+|z\d+/i
      const hasModelPattern = modelPattern.test(text)
      
      // A link must either have phone URL pattern OR have brand/model keywords
      if (!hasPhoneUrlPattern && !hasPhoneBrand && !hasModelPattern) return
      
      // Avoid duplicates
      seen.add(link)
      
      const fullUrl = link.startsWith('http') ? link : `https://www.gsmarena.com/${link}`
      results.push({
        name: text,
        url: fullUrl,
        snippet: text
      })
      
      // Stop after 10 results to avoid too much data
      if (results.length >= 10) return false
    })

    if (results.length > 0) {
      return results.slice(0, 10)
    }

    // If no results found, return helpful message
    return {
      success: false,
      error: 'No phone results found. Try searching with:',
      suggestion: '- Just the brand: "Samsung", "iPhone", "Google"',
      suggestion2: '- Brand + model: "Samsung S24", "iPhone 16", "Pixel 9"'
    }
  } catch (error) {
    console.error('Search error:', error.message)
    return {
      success: false,
      error: `Search failed: ${error.message}`
    }
  }
}

async function scrapePhoneDetails(phoneUrl) {
  try {
    const response = await axios.get(phoneUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.gsmarena.com/'
      },
      timeout: 15000
    })

    const $ = cheerio.load(response.data)
    
    // Extract phone name - try multiple selectors
    let fullName = $('h1.specs-phone-name-title').text().trim() || 
                   $('div.specs-phone-name-title').text().trim() ||
                   $('h1').first().text().trim() ||
                   $('title').text().split('-')[0].trim()
    
    // Clean up name
    fullName = fullName.replace(/\s+/g, ' ').trim()
    
    // Verify this is actually a phone page, not a wrong page
    if (!fullName || fullName.length < 3 || fullName.includes('GSM Arena') || fullName.toLowerCase() === 'news') {
      // Try to get from breadcrumb or other location
      fullName = $('span[itemprop="name"]').first().text().trim() || fullName
      
      if (!fullName || fullName.length < 3) {
        throw new Error('Could not extract valid phone name from page')
      }
    }
    
    const specs = []
    const variants = new Set()
    const colors = new Set()
    let batteryCapacity = null

    // Extract specs from all tables on the page
    $('table').each((tableIdx, table) => {
      const rows = $(table).find('tr')
      
      rows.each((idx, row) => {
        const cells = $(row).find('td')
        if (cells.length >= 2) {
          let specName = cells.eq(0).text().trim()
          let specValue = cells.eq(1).text().trim()

          // Clean up the spec name and value
          specName = specName.replace(/\s+/g, ' ').replace(/\*/g, '').trim()
          specValue = specValue.replace(/\s+/g, ' ').replace(/\*/g, '').trim()

          // Skip if empty or unreasonable length
          if (!specName || !specValue || specName.length < 2 || specValue.length === 0 || specName.length > 100) {
            return
          }

          // Skip if value looks like garbage (price without context, single characters, etc)
          if (specValue.match(/^\$\s+\d+\.\d+$/) || specValue.length === 1) {
            return
          }

          // Special handling for battery specs
          if (specName === 'Capacity' || (specName === 'Type' && tableIdx > 5 && specValue.includes('mAh'))) {
            if (specValue.includes('mAh')) {
              batteryCapacity = specValue
              specs.push({
                spec_group: 'Battery',
                spec_name: 'Battery Capacity',
                spec_value: specValue,
                sort_order: 0
              })
            }
            return
          }

          // Special handling for camera specs
          if ((specName === 'Main Camera' || specName === 'Triple' || specName === 'Dual' || specName === 'Quad') && specValue.includes('MP')) {
            if (!specs.find(s => s.spec_name === 'Main Camera' && s.spec_group === 'Camera')) {
              specs.push({
                spec_group: 'Camera',
                spec_name: 'Main Camera',
                spec_value: specValue,
                sort_order: 0
              })
            }
            return
          } else if (specName === 'Selfie camera' || specName === 'Single' || specName === 'Front Camera') {
            if (specValue.includes('MP') && !specs.find(s => s.spec_name === 'Front Camera' && s.spec_group === 'Camera')) {
              specs.push({
                spec_group: 'Camera',
                spec_name: 'Front Camera',
                spec_value: specValue,
                sort_order: 0
              })
            }
            return
          }

          // Special handling for RAM/Storage to avoid duplicates and malformed data
          if (specName === 'RAM' && specValue.includes('GB') && !specValue.includes('$')) {
            if (!specs.find(s => s.spec_name === 'RAM' && s.spec_group === 'Performance')) {
              specs.push({
                spec_group: 'Performance',
                spec_name: 'RAM',
                spec_value: specValue,
                sort_order: 0
              })
            }
            const ramMatches = specValue.match(/\d+\s*GB/gi)
            if (ramMatches) {
              ramMatches.forEach(s => variants.add(s.replace(/\s/g, '')))
            }
            return
          }

          if (specName === 'Internal' && specValue.includes('GB')) {
            if (!specs.find(s => s.spec_name === 'Storage' && s.spec_group === 'Performance')) {
              specs.push({
                spec_group: 'Performance',
                spec_name: 'Storage',
                spec_value: specValue,
                sort_order: 0
              })
            }
            const storageMatches = specValue.match(/\d+\s*GB/gi)
            if (storageMatches) {
              storageMatches.forEach(s => variants.add(s.replace(/\s/g, '')))
            }
            return
          }

          // Regular spec mapping with Network cleanup
          const mapped = SPEC_MAPPING[specName] || findClosestMapping(specName)
          
          if (mapped) {
            // Skip detailed network bands/speed; keep only Network Technology
            if (mapped.group === 'Network' && mapped.name !== 'Network Technology') {
              return
            }

            // Skip Pricing rows entirely
            if (mapped.group === 'Pricing') {
              return
            }

            // Avoid duplicates - check by group + name
            if (!specs.find(s => s.spec_name === mapped.name && s.spec_group === mapped.group)) {
              specs.push({
                spec_group: mapped.group,
                spec_name: mapped.name,
                spec_value: specValue,
                sort_order: 0
              })
            }
          }

          // Extract colors
          if (specName.toLowerCase().includes('color')) {
            specValue.split(/[,;\/]/).forEach(color => {
              const c = color.trim()
              if (c.length > 0 && c.length < 50 && !c.includes('%') && !c.includes('Spec') && !c.toLowerCase().includes('color') && !c.toLowerCase().includes('available')) {
                colors.add(c)
              }
            })
          }
        }
      })
    })

    // If no specs found, this might not be a valid phone page
    if (specs.length === 0) {
      throw new Error(`No specifications found for phone: ${fullName}`)
    }

    // Extract key specs
    const keySpecs = []
    
    const displaySpec = specs.find(s => s.spec_group === 'Display' && (s.spec_name.includes('Size') || s.spec_name.includes('Display')))
    if (displaySpec) {
      keySpecs.push({
        icon: 'display',
        title: 'Display',
        value: displaySpec.spec_value,
        sort_order: 0
      })
    }

    const procSpec = specs.find(s => s.spec_group === 'Performance' && s.spec_name.includes('Processor'))
    if (procSpec) {
      keySpecs.push({
        icon: 'processor',
        title: 'Processor',
        value: procSpec.spec_value,
        sort_order: 1
      })
    } else {
      const cpuSpec = specs.find(s => s.spec_group === 'Performance' && s.spec_name.includes('CPU'))
      if (cpuSpec) {
        keySpecs.push({
          icon: 'processor',
          title: 'Processor',
          value: cpuSpec.spec_value,
          sort_order: 1
        })
      }
    }

    const cameraSpec = specs.find(s => s.spec_group === 'Camera' && s.spec_name.includes('Main'))
    if (cameraSpec) {
      keySpecs.push({
        icon: 'camera',
        title: 'Camera',
        value: cameraSpec.spec_value,
        sort_order: 2
      })
    }

    const batterySpec = specs.find(s => s.spec_group === 'Battery' && s.spec_name.includes('Capacity'))
    if (batterySpec) {
      keySpecs.push({
        icon: 'battery',
        title: 'Battery',
        value: batterySpec.spec_value,
        sort_order: 3
      })
    } else {
      const chargeSpec = specs.find(s => s.spec_group === 'Battery' && s.spec_name.includes('Charging'))
      if (chargeSpec) {
        keySpecs.push({
          icon: 'battery',
          title: 'Battery',
          value: chargeSpec.spec_value,
          sort_order: 3
        })
      }
    }

    // Build final result
    const finalKeySpecs = keySpecs.length >= 4 ? keySpecs : [
      keySpecs.find(k => k.icon === 'display') || { icon: 'display', title: 'Display', value: 'Not found', sort_order: 0 },
      keySpecs.find(k => k.icon === 'processor') || { icon: 'processor', title: 'Processor', value: 'Not found', sort_order: 1 },
      keySpecs.find(k => k.icon === 'camera') || { icon: 'camera', title: 'Camera', value: 'Not found', sort_order: 2 },
      keySpecs.find(k => k.icon === 'battery') || { icon: 'battery', title: 'Battery', value: 'Not found', sort_order: 3 }
    ]

    return {
      success: true,
      data: {
        name: fullName,
        url: phoneUrl,
        specifications: specs,
        keySpecifications: finalKeySpecs,
        variants: Array.from(variants).sort(),
        colors: Array.from(colors),
        totalSpecs: specs.length
      }
    }
  } catch (error) {
    console.error('Scrape error:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

// Helper function to find closest mapping match
function findClosestMapping(specName) {
  const lowerName = specName.toLowerCase()
  
  // Network & Connectivity
  if (lowerName.includes('technology') || lowerName.includes('gsm') || lowerName.includes('hspa') || lowerName.includes('lte')) return { group: 'Network', name: 'Network Technology' }
  if (lowerName.includes('2g') || lowerName.includes('3g') || lowerName.includes('4g') || lowerName.includes('5g')) return { group: 'Network', name: specName }
  if (lowerName.includes('speed')) return { group: 'Network', name: 'Speed' }
  
  // Launch
  if (lowerName.includes('announced') || lowerName.includes('released') || lowerName.includes('launch')) return { group: 'Launch', name: specName }
  if (lowerName.includes('status')) return { group: 'Launch', name: 'Status' }
  
  // Design/Body
  if (lowerName.includes('dimension')) return { group: 'Design', name: 'Dimensions' }
  if (lowerName.includes('weight')) return { group: 'Design', name: 'Weight' }
  if (lowerName.includes('build') || lowerName.includes('material')) return { group: 'Design', name: 'Build Materials' }
  if (lowerName.includes('sim')) return { group: 'Design', name: 'SIM Type' }
  if (lowerName.includes('water') || lowerName.includes('dust') || lowerName.includes('ip67') || lowerName.includes('ip68')) return { group: 'Design', name: 'Water Resistance' }
  if (lowerName.includes('color')) return { group: 'Design', name: 'Colors' }
  if (lowerName.includes('model') && lowerName.includes('number')) return { group: 'Design', name: 'Model Numbers' }
  
  // Display
  if (lowerName.includes('display') && lowerName.includes('type')) return { group: 'Display', name: 'Display Type' }
  if (lowerName.includes('display') && lowerName.includes('size')) return { group: 'Display', name: 'Display Size' }
  if (lowerName.includes('screen') || lowerName.includes('amoled') || lowerName.includes('lcd') || lowerName.includes('oled')) return { group: 'Display', name: 'Display Type' }
  if (lowerName.includes('resolution') || lowerName.includes('pixel')) return { group: 'Display', name: 'Resolution' }
  if (lowerName.includes('ratio') || lowerName.includes('aspect')) return { group: 'Display', name: 'Aspect Ratio' }
  if (lowerName.includes('density') || lowerName.includes('ppi')) return { group: 'Display', name: 'Pixel Density' }
  if (lowerName.includes('refresh')) return { group: 'Display', name: 'Refresh Rate' }
  if (lowerName.includes('protection') && lowerName.includes('glass')) return { group: 'Display', name: 'Glass Protection' }
  if (lowerName.includes('brightness')) return { group: 'Display', name: 'Brightness' }
  if (lowerName.includes('hdr')) return { group: 'Display', name: 'HDR Support' }
  
  // Platform
  if (lowerName.includes('os') || lowerName.includes('android')) return { group: 'Platform', name: 'Operating System' }
  if (lowerName.includes('upgrade') || lowerName.includes('ui')) return { group: 'Platform', name: specName }
  
  // Performance
  if (lowerName.includes('processor') || lowerName.includes('chipset') || lowerName.includes('snapdragon') || lowerName.includes('exynos')) return { group: 'Performance', name: 'Processor' }
  if (lowerName.includes('cpu') || lowerName.includes('core') || lowerName.includes('cortex')) return { group: 'Performance', name: 'CPU' }
  if (lowerName.includes('gpu') || lowerName.includes('adreno')) return { group: 'Performance', name: 'GPU' }
  if (lowerName.includes('memory') || lowerName.includes('ram')) return { group: 'Performance', name: 'RAM' }
  if (lowerName.includes('storage') || lowerName.includes('gb')) return { group: 'Performance', name: 'Storage' }
  if (lowerName.includes('card') || lowerName.includes('microsd')) return { group: 'Performance', name: 'Card Slot' }
  
  // Camera
  if (lowerName.includes('camera')) {
    if (lowerName.includes('main') || lowerName.includes('back') || lowerName.includes('rear') || lowerName.includes('primary')) return { group: 'Camera', name: 'Main Camera' }
    if (lowerName.includes('front') || lowerName.includes('selfie')) return { group: 'Camera', name: 'Front Camera' }
    if (lowerName.includes('triple') || lowerName.includes('dual') || lowerName.includes('quad')) return { group: 'Camera', name: specName }
    return { group: 'Camera', name: specName }
  }
  if (lowerName.includes('video') || lowerName.includes('recording') || lowerName.includes('4k') || lowerName.includes('1080p')) return { group: 'Camera', name: 'Video Recording' }
  if (lowerName.includes('photo') || lowerName.includes('flash') || lowerName.includes('ois') || lowerName.includes('af')) return { group: 'Camera', name: 'Camera Features' }
  
  // Audio
  if (lowerName.includes('speaker') || lowerName.includes('audio')) return { group: 'Audio', name: 'Loudspeaker' }
  if (lowerName.includes('3.5') || lowerName.includes('jack') || lowerName.includes('headphone')) return { group: 'Audio', name: '3.5mm Jack' }
  
  // Connectivity
  if (lowerName.includes('wlan') || lowerName.includes('wifi') || lowerName.includes('802.11')) return { group: 'Connectivity', name: 'WiFi' }
  if (lowerName.includes('bluetooth')) return { group: 'Connectivity', name: 'Bluetooth' }
  if (lowerName.includes('gps') || lowerName.includes('positioning') || lowerName.includes('galileo') || lowerName.includes('glonass')) return { group: 'Connectivity', name: 'GPS' }
  if (lowerName.includes('nfc')) return { group: 'Connectivity', name: 'NFC' }
  if (lowerName.includes('radio') || lowerName.includes('fm')) return { group: 'Connectivity', name: 'FM Radio' }
  if (lowerName.includes('usb')) return { group: 'Connectivity', name: 'USB' }
  if (lowerName.includes('network')) return { group: 'Connectivity', name: 'Network' }
  
  // Features
  if (lowerName.includes('sensor')) return { group: 'Features', name: 'Sensors' }
  
  // Battery
  if (lowerName.includes('battery') && lowerName.includes('capacity')) return { group: 'Battery', name: 'Battery Capacity' }
  if (lowerName.includes('battery') && lowerName.includes('type')) return { group: 'Battery', name: 'Battery Type' }
  if (lowerName.includes('battery') || lowerName.includes('mah')) return { group: 'Battery', name: 'Battery Capacity' }
  if (lowerName.includes('charging') || lowerName.includes('watt') || lowerName.includes('45w') || lowerName.includes('65w')) return { group: 'Battery', name: 'Charging' }
  if (lowerName.includes('wireless') && lowerName.includes('charging')) return { group: 'Battery', name: 'Wireless Charging' }
  
  // Tests
  if (lowerName.includes('antutu') || lowerName.includes('geekbench') || lowerName.includes('benchmark')) return { group: 'Tests', name: 'Performance Benchmarks' }
  if (lowerName.includes('nits') || lowerName.includes('measured')) return { group: 'Tests', name: 'Display Quality' }
  if (lowerName.includes('lufs') || lowerName.includes('speaker')) return { group: 'Tests', name: 'Speaker Quality' }
  if (lowerName.includes('endurance') || lowerName.includes('battery')) return { group: 'Tests', name: 'Battery Endurance' }
  if (lowerName.includes('repairability')) return { group: 'Tests', name: 'Repairability' }
  
  // Misc
  if (lowerName.includes('sar')) return { group: 'Safety', name: 'SAR Rating' }
  
  return null
}

export async function POST(req) {
  try {
    const { action, phoneName, phoneUrl } = await req.json()

    if (!action) {
      return NextResponse.json(
        { error: 'Missing action parameter' },
        { status: 400 }
      )
    }

    // Search action
    if (action === 'search') {
      if (!phoneName) {
        return NextResponse.json(
          { error: 'Missing phone name' },
          { status: 400 }
        )
      }

      const results = await searchGSMArena(phoneName)
      return NextResponse.json({ results })
    }

    // Scrape action
    if (action === 'scrape') {
      if (!phoneUrl) {
        return NextResponse.json(
          { error: 'Missing phone URL' },
          { status: 400 }
        )
      }

      const phoneData = await scrapePhoneDetails(phoneUrl)
      return NextResponse.json(phoneData)
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    )
  }
}
