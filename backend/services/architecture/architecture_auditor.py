from services.architecture.dependency_validator import DependencyValidator
from services.architecture.purity_validator import PurityValidator
from services.architecture.contract_validator import ContractValidator
from services.architecture.mutation_validator import MutationValidator
from services.architecture.runtime_contract_validator import RuntimeContractValidator

class ArchitectureAuditor:
    def __init__(self, backend_dir: str):
        self.backend_dir = backend_dir

    def audit(self):
        print("Starting AI Architecture Audit...\n")
        
        validators = [
            ("Layer Boundary & Dependency Graph", DependencyValidator(self.backend_dir)),
            ("Domain Purity (Prompt, Knowledge, Strategy)", PurityValidator(self.backend_dir)),
            ("Context Contracts", ContractValidator()),
            ("Mutation Safety", MutationValidator()),
            ("Runtime Execution Contract", RuntimeContractValidator(self.backend_dir))
        ]
        
        all_passed = True
        
        for name, validator in validators:
            print(f"Executing {name}...")
            passed, failures = validator.validate()
            if passed:
                print(f"  [PASS] {name}")
            else:
                all_passed = False
                print(f"  [FAIL] {name}")
                for f in failures:
                    print(f"    - {f}")
            print()
            
        print("--- Architecture Audit Result ---")
        if all_passed:
            print("[PASS] Overall Architecture")
            return True
        else:
            print("[FAIL] Overall Architecture")
            return False
