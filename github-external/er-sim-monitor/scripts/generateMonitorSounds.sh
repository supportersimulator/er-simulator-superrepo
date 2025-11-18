#!/bin/bash

# Generate realistic medical monitor alert sounds
# Based on IEC 60601-1-8 medical alarm standards

OUTPUT_DIR="assets/sounds/adaptive"
cd /Users/aarontjomsland/er-sim-monitor

echo "🔊 Generating medical monitor alert sounds..."
echo ""

# AWARENESS PHASE - Single clear beeps (60% volume, 440Hz base)
echo "📋 Awareness tones (single notification)..."

# HR awareness - Single beep
ffmpeg -f lavfi -i "sine=frequency=880:duration=0.15" -af "volume=0.6" -y "$OUTPUT_DIR/awareness_hr.mp3" 2>/dev/null

# SpO2 awareness - Lower tone
ffmpeg -f lavfi -i "sine=frequency=660:duration=0.15" -af "volume=0.6" -y "$OUTPUT_DIR/awareness_spo2.mp3" 2>/dev/null

# BP awareness - Medium tone
ffmpeg -f lavfi -i "sine=frequency=740:duration=0.15" -af "volume=0.6" -y "$OUTPUT_DIR/awareness_bp.mp3" 2>/dev/null

# RR awareness - Low tone
ffmpeg -f lavfi -i "sine=frequency=550:duration=0.15" -af "volume=0.6" -y "$OUTPUT_DIR/awareness_rr.mp3" 2>/dev/null

# Rhythm awareness - Two-tone
ffmpeg -f lavfi -i "sine=frequency=880:duration=0.1,sine=frequency=660:duration=0.1" -filter_complex "concat=n=2:v=0:a=1" -af "volume=0.6" -y "$OUTPUT_DIR/awareness_rhythm.mp3" 2>/dev/null

# Generic awareness
ffmpeg -f lavfi -i "sine=frequency=800:duration=0.15" -af "volume=0.6" -y "$OUTPUT_DIR/awareness_generic.mp3" 2>/dev/null

# PERSISTENCE PHASE - Soft recurring reminders (35% volume, gentler)
echo "📋 Persistence tones (soft reminders)..."

# HR persistence - Double beep
ffmpeg -f lavfi -i "sine=frequency=880:duration=0.08,sine=frequency=0:duration=0.04,sine=frequency=880:duration=0.08" -filter_complex "concat=n=3:v=0:a=1" -af "volume=0.35" -y "$OUTPUT_DIR/persistence_hr.mp3" 2>/dev/null

# SpO2 persistence
ffmpeg -f lavfi -i "sine=frequency=660:duration=0.08,sine=frequency=0:duration=0.04,sine=frequency=660:duration=0.08" -filter_complex "concat=n=3:v=0:a=1" -af "volume=0.35" -y "$OUTPUT_DIR/persistence_spo2.mp3" 2>/dev/null

# BP persistence
ffmpeg -f lavfi -i "sine=frequency=740:duration=0.08,sine=frequency=0:duration=0.04,sine=frequency=740:duration=0.08" -filter_complex "concat=n=3:v=0:a=1" -af "volume=0.35" -y "$OUTPUT_DIR/persistence_bp.mp3" 2>/dev/null

# RR persistence
ffmpeg -f lavfi -i "sine=frequency=550:duration=0.08,sine=frequency=0:duration=0.04,sine=frequency=550:duration=0.08" -filter_complex "concat=n=3:v=0:a=1" -af "volume=0.35" -y "$OUTPUT_DIR/persistence_rr.mp3" 2>/dev/null

# Generic persistence
ffmpeg -f lavfi -i "sine=frequency=800:duration=0.08,sine=frequency=0:duration=0.04,sine=frequency=800:duration=0.08" -filter_complex "concat=n=3:v=0:a=1" -af "volume=0.35" -y "$OUTPUT_DIR/persistence_generic.mp3" 2>/dev/null

# NEGLECT PHASE - Insistent alerts (65% volume, triple beep)
echo "📋 Neglect tones (insistent alerts)..."

# HR neglect - Triple beep
ffmpeg -f lavfi -i "sine=frequency=880:duration=0.1,sine=frequency=0:duration=0.05,sine=frequency=880:duration=0.1,sine=frequency=0:duration=0.05,sine=frequency=880:duration=0.1" -filter_complex "concat=n=5:v=0:a=1" -af "volume=0.65" -y "$OUTPUT_DIR/neglect_hr.mp3" 2>/dev/null

# SpO2 neglect
ffmpeg -f lavfi -i "sine=frequency=660:duration=0.1,sine=frequency=0:duration=0.05,sine=frequency=660:duration=0.1,sine=frequency=0:duration=0.05,sine=frequency=660:duration=0.1" -filter_complex "concat=n=5:v=0:a=1" -af "volume=0.65" -y "$OUTPUT_DIR/neglect_spo2.mp3" 2>/dev/null

# BP neglect
ffmpeg -f lavfi -i "sine=frequency=740:duration=0.1,sine=frequency=0:duration=0.05,sine=frequency=740:duration=0.1,sine=frequency=0:duration=0.05,sine=frequency=740:duration=0.1" -filter_complex "concat=n=5:v=0:a=1" -af "volume=0.65" -y "$OUTPUT_DIR/neglect_bp.mp3" 2>/dev/null

# RR neglect
ffmpeg -f lavfi -i "sine=frequency=550:duration=0.1,sine=frequency=0:duration=0.05,sine=frequency=550:duration=0.1,sine=frequency=0:duration=0.05,sine=frequency=550:duration=0.1" -filter_complex "concat=n=5:v=0:a=1" -af "volume=0.65" -y "$OUTPUT_DIR/neglect_rr.mp3" 2>/dev/null

# Rhythm neglect
ffmpeg -f lavfi -i "sine=frequency=880:duration=0.1,sine=frequency=0:duration=0.05,sine=frequency=660:duration=0.1,sine=frequency=0:duration=0.05,sine=frequency=880:duration=0.1" -filter_complex "concat=n=5:v=0:a=1" -af "volume=0.65" -y "$OUTPUT_DIR/neglect_rhythm.mp3" 2>/dev/null

# Generic neglect
ffmpeg -f lavfi -i "sine=frequency=800:duration=0.1,sine=frequency=0:duration=0.05,sine=frequency=800:duration=0.1,sine=frequency=0:duration=0.05,sine=frequency=800:duration=0.1" -filter_complex "concat=n=5:v=0:a=1" -af "volume=0.65" -y "$OUTPUT_DIR/neglect_generic.mp3" 2>/dev/null

# CRITICAL RHYTHMS - Continuous alarms
echo "📋 Critical rhythm alarms..."

# VFib - Rapid irregular beeping (chaotic)
ffmpeg -f lavfi -i "sine=frequency=1000:duration=0.05,sine=frequency=0:duration=0.03,sine=frequency=950:duration=0.05,sine=frequency=0:duration=0.03,sine=frequency=1100:duration=0.05,sine=frequency=0:duration=0.03,sine=frequency=980:duration=0.05" -filter_complex "concat=n=7:v=0:a=1,aloop=loop=3:size=2e+09" -af "volume=0.8" -t 2 -y "$OUTPUT_DIR/critical_vfib.mp3" 2>/dev/null

# VTach - Fast regular beeping
ffmpeg -f lavfi -i "sine=frequency=1000:duration=0.08,sine=frequency=0:duration=0.04" -filter_complex "concat=n=2:v=0:a=1,aloop=loop=15:size=2e+09" -af "volume=0.8" -t 2 -y "$OUTPUT_DIR/critical_vtach.mp3" 2>/dev/null

# Asystole - Continuous flat tone (ominous)
ffmpeg -f lavfi -i "sine=frequency=800:duration=2" -af "volume=0.7" -y "$OUTPUT_DIR/critical_asystole.mp3" 2>/dev/null

# UTILITY SOUNDS
echo "📋 Utility sounds..."

# Acknowledge chime - Pleasant ascending tone
ffmpeg -f lavfi -i "sine=frequency=523:duration=0.08,sine=frequency=659:duration=0.08,sine=frequency=784:duration=0.12" -filter_complex "concat=n=3:v=0:a=1" -af "volume=0.5,afade=t=out:st=0.2:d=0.08" -y "$OUTPUT_DIR/acknowledge.mp3" 2>/dev/null

# Normalize chime - Gentle descending tone
ffmpeg -f lavfi -i "sine=frequency=784:duration=0.08,sine=frequency=659:duration=0.08,sine=frequency=523:duration=0.12" -filter_complex "concat=n=3:v=0:a=1" -af "volume=0.4,afade=t=out:st=0.2:d=0.08" -y "$OUTPUT_DIR/normalize.mp3" 2>/dev/null

echo ""
echo "✅ Sound generation complete!"
echo ""
echo "Generated sounds:"
ls -lh "$OUTPUT_DIR"/*.mp3 | awk '{print "  " $9 " - " $5}'
echo ""
echo "🔊 Reload the app to hear the new sounds!"
