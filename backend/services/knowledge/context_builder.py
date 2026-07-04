from services.knowledge.pipeline import Normalizer, Tokenizer, KeywordAnalyzer
from services.knowledge.resolvers import DictionaryResolver
from services.knowledge.knowledge_validator import KnowledgeValidator
from services.knowledge.knowledge_context import KnowledgeContext
import time
from telemetry.event_bus import EventBus
from telemetry.events import KnowledgeStarted, KnowledgeResolved, KnowledgeFailed
from telemetry.session_manager import SessionManager

class ContextBuilder:
    def __init__(self, pack_dir: str):
        self.pack_dir = pack_dir
        self.resolver = DictionaryResolver(pack_dir)
        self.trace = []

    def build_context(self, keyword: str) -> KnowledgeContext:
        start_time = time.time()
        session_id, corr_id = SessionManager.get_session()
        EventBus.publish(KnowledgeStarted(session_id, corr_id, metadata={"keyword": keyword}))
        
        self.trace = []
        context = KnowledgeContext()
        
        # 1. Normalize
        normalized = Normalizer.normalize(keyword)
        self.trace.append({"stage": "Normalizer", "output": normalized})
        
        # 2. Tokenize
        tokens = Tokenizer.tokenize(normalized)
        self.trace.append({"stage": "Tokenizer", "output": tokens})
        
        # 3. Analyze
        analyzed = KeywordAnalyzer.analyze(tokens)
        self.trace.append({"stage": "KeywordAnalyzer", "output": analyzed})
        
        # 4. Resolve
        self.resolver.resolve(analyzed, context)
        self.trace.append({"stage": "Resolver", "output": "Resolution Complete"})
        
        # 5. Validate
        KnowledgeValidator.validate(context)
        self.trace.append({"stage": "Validator", "output": context.fallbacks_used})
        
        # 6. Freeze Context
        context.freeze()
        
        runtime_ms = int((time.time() - start_time) * 1000)
        EventBus.publish(KnowledgeResolved(session_id, corr_id, runtime_ms=runtime_ms, metadata={
            "fallbacks": context.fallbacks_used,
            "warnings": context.warnings
        }))
        
        return context
        
    def get_trace(self):
        return self.trace
