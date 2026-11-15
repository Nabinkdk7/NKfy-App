/**
 * Curated artist and keyword catalog used to expand search coverage.
 * These names are always queried against the providers (Audius/Jamendo) so
 * that searching any of them — or a generic genre term — surfaces the full
 * artist catalog instead of a short, incomplete list.
 */
export const nepaliArtists = [
  // Hip-hop / rap / viral
  'MC Flo', 'Tuki Music', 'Updated Thakadar', 'Kali Prasad', 'Tripathi', 'Nagendra Lama',
  'Navin Rayamajhi', 'Ludex', 'Purna Nanda Shakya', 'Rajan Rajbhandari', 'Roshan Pradhan',
  'Santosh Paudel', 'Saili', 'Udaya Krishna Khadka', 'Yash Kumar Shrestha', 'Kanchan Pokharel',
  'Nabin Khadka', 'Nirajan', 'Himalaya', 'Sanjeev Upreti', 'Kuxta', 'Rima Gurung',
  // Pop / modern Nepali
  'Sagar Acharya', 'Swasthim', 'Prakash Katuwal', 'Bishnu Majhi', 'Neetesh Jung Basnet',
  'Rajesh Payal Rai', 'Akashem Rajbanshi', 'Binod Raut', 'Ganesh Rasaili', 'Roshan Khatri',
  'Satyam Paudel', 'Aawara', 'The Butchers', 'Rose VD', 'Rekha Thapa', 'Samshara',
  // Folk / tradition / karaoke
  'Tara Devi', 'Traram Subba Limbu', 'Bipul Chettri', 'Sundar Shrestha', 'Aminrasmi Pramod',
  'Santosh Khanal', 'Roshani Kumar', 'Jeevan Bikram Thapa', 'Umakant Bhattarai', 'Akhil Nepali',
  'Jaya Sandhu', 'Gurung Brothers', 'Seti Todi', 'Bhoto Kalo', 'Luna Pandit',
  // Rock / band / metal
  'The Chosen Ones', 'The Prophets', 'Nepathya', '1974 AD', 'Deshantar', 'Khoj', 'Sur Sudha',
  'Urban Minds', 'The Yak', 'Lohar', 'Parvati Gurung', 'Krysis', 'The Rock City Band',
  'Paarth Band', 'Survivor', 'Bimal Gurung', 'Rabi Karki', 'Sanam Chaudhary', 'Sur Samaj',
  'Utsaah', 'Samantha Mahon', 'Swar Utsaah', 'Pratishtha', 'Rejina Rimal', 'Delight',
  // Old / classic
  'Bhakta Raj Acharya', 'Narayan Baral', 'Govinda Baga', 'Upendra Lama', 'Shobha Gurtu',
  'Sita Thapa', 'Phatibhushan', 'Shree Kumar', 'Manju Devi', 'Indira Joshi', 'Romi Kumari',
  'Ayush Tamrakar', 'Subas Kanth', 'Rakesh Gupta',
] as const;

export const hindiArtists = [
  'Arijit Singh', 'Shreya Ghoshal', 'Sonu Nigam', 'Kumar Sanu', 'Lata Mangeshkar', 'Kishore Kumar',
  'Asha Bhosle', 'Mohammed Rafi', 'AR Rahman', 'Sidhu Moose Wala', 'Guru Randhawa', 'Badshah',
  'Yo Yo Honey Singh', 'Emiway Bantai', 'Ap Dhillon', 'Diljit Dosanjh', 'Karan Aujla', 'B Praak',
  'Jubin Nautiyal', 'Neha Kakkar', 'Palak Muchhal', 'Armaan Malik', 'Guru Randhawa',
  'Aditya A', 'Vishal Mishra', 'Dhwani Bhanushali', 'Anuv Jain', 'Slow Cheeta',
  'Prateek Kuhad', 'Hariharan', 'Sudesh Bhosle', 'Alka Yagnik', 'Udit Narayan',
] as const;

export const englishArtists = [
  'Taylor Swift', 'The Weeknd', 'Drake', 'Kendrick Lamar', 'Billie Eilish', 'Post Malone',
  'Ed Sheeran', 'Dua Lipa', 'Ariana Grande', 'Bruno Mars', 'Coldplay', 'Imagine Dragons',
  'Eminem', 'Justin Bieber', 'Bruno Mars', 'Rahman', 'Zara Larsson', 'Harry Styles',
  'Olivia Rodrigo', 'Lana Del Rey', 'The 1975', 'Arctic Monkeys', 'Slipknot', 'Avenged Sevenfold',
] as const;

export const metalArtists = [
  'Metallica', 'Iron Maiden', 'Megadeth', 'Slayer', 'Black Sabbath', 'Deep Purple', 'Judas Priest',
  'Pantera', 'Slipknot', 'Gojira', 'Lamb of God', 'Cannibal Corpse', 'Amon Amarth',
  'Powerwolf', 'Wintersun', 'Meshuggah', 'Trivium', 'Asking Alexandria', 'Parkway Drive',
  'Epica', 'Nightwish', 'Within Temptation', 'Architects', 'Bring Me The Horizon',
  'Metallica tribute band', 'Sepultura', 'Deicide', 'Morbid Angel', 'Cradle of Filth',
  'Dimmu Borgir', 'Hypocrisy', 'Dark Tranquillity', 'In Flames', 'At The Gates',
] as const;

export const artistKeywords = [
  ...nepaliArtists,
  ...hindiArtists,
  ...englishArtists,
  ...metalArtists,
  // Genre expansions
  'Nepali pop', 'Nepali hip-hop', 'Nepali rap', 'Nepali rock', 'Nepali folk', 'Nepali metal',
  'Nepali old song', 'classic Nepali', 'Nepali romantic', 'Nepali party', 'Nepali viral',
  'K-pop Nepali', 'Nepali sad song', 'Nepali wedding', 'Nepali original',
  'Hindi pop', 'Hindi Bollywood', 'Hindi old song', 'Hindi romantic', 'Hindi party', 'Hindi sad song',
  'Metal', 'Heavy metal', 'Death metal', 'Black metal', 'Thrash metal', 'Progressive metal',
  'English pop', 'English rock', 'English hip-hop', 'English metal',
] as const;

export const allKnownArtists = [
  ...nepaliArtists,
  ...hindiArtists,
  ...englishArtists,
  ...metalArtists,
] as const;

export function findArtistMatches(query: string, limit = 4) {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) return [] as string[];

  const exact = allKnownArtists.filter((artist) => artist.toLowerCase() === normalized);
  const startsWith = allKnownArtists.filter((artist) =>
    artist.toLowerCase().startsWith(normalized)
  );
  const includes = allKnownArtists.filter((artist) => {
    const value = artist.toLowerCase();
    return value.includes(normalized) || normalized.includes(value);
  });

  const seen = new Set<string>();
  const merged = [...exact, ...startsWith, ...includes].filter((artist) => {
    if (seen.has(artist.toLowerCase())) return false;
    seen.add(artist.toLowerCase());
    return true;
  });
  return merged.slice(0, limit);
}
