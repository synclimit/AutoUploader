from typing import List
from review.candidate_metadata import CandidateMetadata

class CandidateCollection:
    def __init__(self, candidates: List[CandidateMetadata]):
        self._candidates = tuple(candidates)
        
    @property
    def candidates(self) -> List[CandidateMetadata]:
        return list(self._candidates)
        
    def __len__(self):
        return len(self._candidates)
        
    def __iter__(self):
        return iter(self._candidates)
