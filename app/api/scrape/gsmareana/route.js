import { NextResponse } from 'next/server'
import axios from 'axios'
import * as cheerio from 'cheerio'

// Map GSMArena spec names to our database structure
const SPEC_MAPPING = {
  // Display
  'Display Size': { group: 'Display', name: 'Display Size' },
  'Display Type': { group: 'Display', name: 'Display Type' },
  'Resolution': { group: 'Display', name: 'Resolution' },
  'Refresh Rate': { group: 'Display', name: 'Refresh Rate' },
  'Glass Protection': { group: 'Display', name: 'Glass Protection' },
  'Brightness': { group: 'Display', name: 'Brightness' },
  
  // Performance
  'Chipset': { group: 'Performance', name: 'Processor' },
  'CPU': { group: 'Performance', name: 'CPU' },
  'GPU': { group: 'Performance', name: 'GPU' },
  'RAM': { group: 'Performance', name: 'RAM' },
  'Storage': { group: 'Performance', name: 'Storage' },
  'Card Slot': { group: 'Performance', name: 'Card Slot' },
  
  // Camera
  'Main Camera': { group: 'Camera', name: 'Main Camera' },
  'Front Camera': { group: 'Camera', name: 'Front Camera' },
  'Video Recording': { group: 'Camera', name: 'Video Recording' },
  'Camera Features': { group: 'Camera', name: 'Camera Features' },
  
  // Battery
  'Battery Capacity': { group: 'Battery', name: 'Battery Capacity' },
  'Battery Type': { group: 'Battery', name: 'Battery Type' },
  'Fast Charging': { group: 'Battery', name: 'Fast Charging' },
  'Wireless Charging': { group: 'Battery', name: 'Wireless Charging' },
  
  // Connectivity
  'Network': { group: 'Connectivity', name: 'Network' },
  'SIM': { group: 'Connectivity', name: 'SIM' },
  'WiFi': { group: 'Connectivity', name: 'WiFi' },
  'Bluetooth': { group: 'Connectivity', name: 'Bluetooth' },
  'USB': { group: 'Connectivity', name: 'USB' },
  'NFC': { group: 'Connectivity', name: 'NFC' },
  
  // Design
  'Dimensions': { group: 'Design', name: 'Dimensions' },
  'Weight': { group: 'Design', name: 'Weight' },
  'Materials': { group: 'Design', name: 'Materials' },
  'Colors': { group: 'Design', name: 'Colors' },
  'Water Resistance': { group: 'Design', name: 'Water Resistance' }
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

          // Only process if both have content and reasonable lengths
          if (specName && specValue && specName.length > 2 && specValue.length > 0 && specName.length < 100) {
            // Try to map to our structure
            const mapped = SPEC_MAPPING[specName] || findClosestMapping(specName)
            
            if (mapped) {
              // Avoid duplicates
              if (!specs.find(s => s.spec_name === mapped.name && s.spec_group === mapped.group)) {
                specs.push({
                  spec_group: mapped.group,
                  spec_name: mapped.name,
                  spec_value: specValue,
                  sort_order: 0
                })
              }
            }

            // Extract variants (storage options)
            if (specName.toLowerCase().includes('storage') || specName.toLowerCase().includes('memory')) {
              const storageMatches = specValue.match(/\d+\s*GB/gi)
              if (storageMatches) {
                storageMatches.forEach(s => {
                  variants.add(s.replace(/\s/g, ''))
                })
              }
            }

            // Extract colors
            if (specName.toLowerCase().includes('color')) {
              specValue.split(/[,;\/]/).forEach(color => {
                const c = color.trim()
                if (c.length > 0 && c.length < 50 && !c.includes('%') && !c.includes('Spec') && !c.toLowerCase().includes('color')) {
                  colors.add(c)
                }
              })
            }
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
  
  // Check for key terms
  if (lowerName.includes('display') || lowerName.includes('screen')) return { group: 'Display', name: specName }
  if (lowerName.includes('processor') || lowerName.includes('chipset') || lowerName.includes('cpu')) return { group: 'Performance', name: specName }
  if (lowerName.includes('memory') || lowerName.includes('storage') || lowerName.includes('ram')) return { group: 'Performance', name: specName }
  if (lowerName.includes('camera') || lowerName.includes('photo') || lowerName.includes('video')) return { group: 'Camera', name: specName }
  if (lowerName.includes('battery') || lowerName.includes('power') || lowerName.includes('charging')) return { group: 'Battery', name: specName }
  if (lowerName.includes('network') || lowerName.includes('sim') || lowerName.includes('wifi') || lowerName.includes('bluetooth') || lowerName.includes('nfc')) return { group: 'Connectivity', name: specName }
  if (lowerName.includes('dimension') || lowerName.includes('weight') || lowerName.includes('material') || lowerName.includes('color') || lowerName.includes('water')) return { group: 'Design', name: specName }
  if (lowerName.includes('gpu') || lowerName.includes('ram') || lowerName.includes('os')) return { group: 'Performance', name: specName }
  
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
