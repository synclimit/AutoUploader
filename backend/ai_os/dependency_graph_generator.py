import json
import os

class DependencyGraphGenerator:
    def generate(self, out_dir: str):
        graph = {
            "nodes": [
                "Keyword", "KnowledgeEngine", "StrategyEngine", "PromptCompiler",
                "ReviewEngine", "DecisionEngine", "FeedbackEngine", "LearningEngine",
                "OptimizerEngine", "ChangePlanner", "ExperimentRunner", "ProductionPromotion",
                "Telemetry", "Dashboard"
            ],
            "edges": [
                ("Keyword", "KnowledgeEngine"),
                ("KnowledgeEngine", "StrategyEngine"),
                ("StrategyEngine", "PromptCompiler"),
                ("PromptCompiler", "ReviewEngine"),
                ("ReviewEngine", "DecisionEngine"),
                ("DecisionEngine", "FeedbackEngine"),
                ("FeedbackEngine", "LearningEngine"),
                ("LearningEngine", "OptimizerEngine"),
                ("OptimizerEngine", "ChangePlanner"),
                ("ChangePlanner", "ExperimentRunner"),
                ("ExperimentRunner", "ProductionPromotion"),
                ("ProductionPromotion", "Dashboard")
            ]
        }
        
        # Write JSON
        with open(os.path.join(out_dir, "dependency_graph.json"), "w") as f:
            json.dump(graph, f, indent=2)
            
        # Write MD
        with open(os.path.join(out_dir, "dependency_graph.md"), "w") as f:
            f.write("# AI OS Dependency Graph\n\n")
            for edge in graph["edges"]:
                f.write(f"* {edge[0]} -> {edge[1]}\n")
                
        # Write Mermaid
        with open(os.path.join(out_dir, "dependency_graph.mmd"), "w") as f:
            f.write("graph TD;\n")
            for edge in graph["edges"]:
                f.write(f"    {edge[0]}-->{edge[1]};\n")
