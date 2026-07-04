class SelectionEngine:
    @staticmethod
    def detect(winner_id: str, user_selected_id: str):
        return {
            "is_override": winner_id != user_selected_id,
            "selected": user_selected_id
        }

class OverrideEngine:
    @staticmethod
    def detect(is_override: bool):
        return is_override

class EditEngine:
    @staticmethod
    def calculate(original_text: str, edited_text: str):
        if not original_text and not edited_text:
            return 0.0
        if not original_text:
            return 100.0
            
        # Pure Python Levenshtein
        if len(original_text) > len(edited_text):
            original_text, edited_text = edited_text, original_text

        distances = range(len(original_text) + 1)
        for index2, char2 in enumerate(edited_text):
            new_distances = [index2 + 1]
            for index1, char1 in enumerate(original_text):
                if char1 == char2:
                    new_distances.append(distances[index1])
                else:
                    new_distances.append(1 + min((distances[index1], distances[index1 + 1], new_distances[-1])))
            distances = new_distances
            
        distance = distances[-1]
        max_len = max(len(original_text), len(edited_text))
        
        if max_len == 0:
            return 0.0
        return (distance / max_len) * 100

class SaveEngine:
    @staticmethod
    def detect(action: str):
        # Action can be 'saved', 'discarded', 'cancelled'
        return action == "saved"

class ApplyEngine:
    @staticmethod
    def detect(action: str):
        # Action can be 'applied', 'rejected'
        return action == "applied"
