JRPRenaissance.zip contains the Bravura mensuralSignumUp (EA00) and
mensuralSignumDown (EA01) outlines and a renamed WOFF2 subset, packaged as
Verovio custom font resources. See OFL.txt for the SIL Open Font License.
Original font: https://github.com/steinbergmedia/bravura

The glyph outlines have ink bounds x=0..285, y=0..471 (1000 units per em).
Their layout boxes reserve 770 units of height to retain the website's approved
clearance below lyrics. The displayed outline and advance width remain original.
Other music glyphs use Verovio's Leipzig fallback.

The base64 archive embedded in _includes/scripts/signum-congruentiae.js must
match this ZIP. The font is supplied before MEI layout, with explicit glyph.num
because custom glyph names do not extend the built-in Bravura name table.
The SVG patch only retains ink centering and half a staff-space of clearance;
it does not substitute glyphs or inject fonts.
