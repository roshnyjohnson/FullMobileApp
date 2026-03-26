import io
import csv
from datetime import datetime
from fpdf import FPDF
from collections import Counter

def clean_text(text):
    if text is None: return ""
    text = str(text)
    # Convert common unicode characters to ascii equivalents so FPDF Latin-1 doesn't crash
    text = text.replace('\u2014', '-').replace('\u2013', '-')
    text = text.replace('\u2018', "'").replace('\u2019', "'")
    text = text.replace('\u201c', '"').replace('\u201d', '"')
    return text.encode('latin-1', 'replace').decode('latin-1')


def generate_pdf_report(data: dict, timeframe_str: str, start_date: datetime, end_date: datetime) -> bytes:
    """Generates a PDF report from the aggregated crowd and alert data, broken down by zone."""
    pdf = FPDF()
    pdf.add_page()
    
    zone_map = data.get("zone_map", {})
    
    # Header
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(0, 10, "CrowdSafety System Report", ln=True, align='C')
    pdf.set_font("Arial", '', 12)
    pdf.cell(0, 10, f"Period: {clean_text(timeframe_str).capitalize()}", ln=True, align='C')
    pdf.set_font("Arial", 'I', 10)
    pdf.cell(0, 10, f"From: {start_date.strftime('%Y-%m-%d %H:%M')} To: {end_date.strftime('%Y-%m-%d %H:%M')}", ln=True, align='C')
    pdf.ln(10)

    # High-Level Summary
    pdf.set_font("Arial", 'B', 14)
    pdf.cell(0, 10, "1. Executive Summary", ln=True)
    pdf.set_font("Arial", '', 11)
    
    total_readings = len(data.get("readings", []))
    total_alerts = len(data.get("alerts", []))
    
    readings = data.get("readings", [])
    max_count = max([r.get("people_count", 0) for r in readings], default=0)
    max_density = max([r.get("density_value", 0) for r in readings], default=0)
    avg_density = sum([r.get("density_value", 0) for r in readings]) / len(readings) if readings else 0
    
    pdf.cell(0, 8, f"Overall Peak Crowd Count: {max_count} people", ln=True)
    pdf.cell(0, 8, f"Total Safety Alerts Triggered: {total_alerts}", ln=True)
    pdf.cell(0, 8, f"Overall Peak Density: {round(max_density, 2)} p/m²", ln=True)
    pdf.cell(0, 8, f"Overall Average Density: {round(avg_density, 2)} p/m²", ln=True)
    pdf.cell(0, 8, f"Total Database Sensor Readings: {total_readings}", ln=True)
    pdf.ln(5)

    # Zone-by-Zone Summary
    pdf.set_font("Arial", 'B', 14)
    pdf.cell(0, 10, "2. Zone-by-Zone Analysis", ln=True)
    pdf.set_font("Arial", '', 11)
    
    alerts = data.get("alerts", [])
    
    if not readings and not alerts:
        pdf.cell(0, 8, "No data available for this period.", ln=True)
    else:
        # Group data by zone
        zones = set(r.get("zone_id") for r in readings).union(a.get("zone_id") for a in alerts)
        
        for zid in sorted(list(zones)):
            z_name = clean_text(zone_map.get(zid, f"Zone {zid}"))
            pdf.set_font("Arial", 'B', 12)
            pdf.cell(0, 8, f"--- {z_name.upper()} (ID: {zid}) ---", ln=True)
            pdf.set_font("Arial", '', 11)
            
            z_readings = [r for r in readings if r.get("zone_id") == zid]
            z_alerts = [a for a in alerts if a.get("zone_id") == zid]
            
            if z_readings:
                z_densities = [r.get("density_value", 0) for r in z_readings]
                z_counts = [r.get("people_count", 0) for r in z_readings]
                pdf.cell(0, 8, f"  Peak Count: {max(z_counts)} people", ln=True)
                pdf.cell(0, 8, f"  Peak Density: {round(max(z_densities), 2)} p/m² | Avg Density: {round(sum(z_densities)/len(z_densities), 2)} p/m²", ln=True)
            else:
                pdf.cell(0, 8, f"  No crowd readings recorded.", ln=True)
                
            if z_alerts:
                pdf.cell(0, 8, f"  Total Alerts: {len(z_alerts)}", ln=True)
                risk_counts = Counter([a.get("risk_level", "UNKNOWN") for a in z_alerts])
                for risk, count in risk_counts.items():
                    pdf.cell(0, 8, f"    - {clean_text(risk)}: {count} occurrences", ln=True)
            else:
                pdf.cell(0, 8, f"  No alerts triggered.", ln=True)
            pdf.ln(3)
            
    # Output to bytes
    out = pdf.output(dest='S')
    return out.encode('latin-1', 'replace') if isinstance(out, str) else bytes(out)

def generate_csv_report(data: dict, start_date: datetime, end_date: datetime) -> bytes:
    """Generates a CSV report from the aggregated crowd and alert data, with zone context."""
    output = io.StringIO()
    writer = csv.writer(output)
    
    zone_map = data.get("zone_map", {})
    
    # Metadata Header
    writer.writerow(["CrowdSafety System Report"])
    writer.writerow(["Start Date", start_date.strftime('%Y-%m-%d %H:%M')])
    writer.writerow(["End Date", end_date.strftime('%Y-%m-%d %H:%M')])
    writer.writerow([])
    
    # Readings Data
    writer.writerow(["--- CROWD READINGS ---"])
    writer.writerow(["Reading ID", "Zone ID", "Zone Name", "Device ID", "People Count", "Density (p/m²)", "Timestamp"])
    for r in data.get("readings", []):
        writer.writerow([
            r.get("reading_id"),
            r.get("zone_id"),
            zone_map.get(r.get("zone_id"), "Unknown"),
            r.get("device_id"),
            r.get("people_count"),
            r.get("density_value"),
            r.get("timestamp")
        ])
    writer.writerow([])
        
    # Alerts Data
    writer.writerow(["--- SAFETY ALERTS ---"])
    writer.writerow(["Alert ID", "Zone ID", "Zone Name", "Risk Level", "Recommended Action", "Timestamp"])
    for a in data.get("alerts", []):
        writer.writerow([
            a.get("alert_id"),
            a.get("zone_id"),
            zone_map.get(a.get("zone_id"), "Unknown"),
            a.get("risk_level"),
            a.get("recommended_action"),
            a.get("timestamp")
        ])
        
    return output.getvalue().encode('utf-8')
