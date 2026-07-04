from typing import Dict, Any, List
from .interfaces import RuleAnalyzer

class DiagnosisRuleEngine:
    def __init__(self):
        self.analyzer = RuleAnalyzer()
        
    def generate_recommendations(self, metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        recommendations = []
        
        # Safe metric extraction
        ctr = metrics.get("analytics", {}).get("ctr", 0)
        views = metrics.get("channel", {}).get("views", 0)
        
        # Example Rules (Rule Engine layer)
        if ctr < 4.0 and views > 100:
            recommendations.append({
                "rule": "Low CTR",
                "condition": "CTR < 4%",
                "severity": "WARNING",
                "recommendation": "Thumbnail kurang menarik. Pertimbangkan untuk mengganti thumbnail dengan kontras warna yang lebih tinggi.",
                "confidence": 92
            })
            
        if views > 10000:
            recommendations.append({
                "rule": "High Traffic",
                "condition": "Views > 10000",
                "severity": "INFO",
                "recommendation": "Pertahankan niche ini. Algoritma YouTube sedang merekomendasikan video Anda.",
                "confidence": 85
            })
            
        if not recommendations:
            recommendations.append({
                "rule": "Normal",
                "condition": "Stable Metrics",
                "severity": "INFO",
                "recommendation": "Performa channel Anda stabil. Terus upload video secara konsisten.",
                "confidence": 95
            })
            
        return recommendations

diagnosis_engine = DiagnosisRuleEngine()
