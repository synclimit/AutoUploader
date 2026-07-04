import tkinter as tk
from tkinter import ttk, messagebox
import rsa
import json
import base64
import os
from datetime import date
from pathlib import Path

class LicenseGeneratorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("AutoUploader License Generator")
        self.root.geometry("400x320")
        self.root.resizable(False, False)
        
        self.script_dir = Path(__file__).parent
        self.private_key_path = self.script_dir / 'private.pem'
        
        self.create_widgets()
        
    def create_widgets(self):
        style = ttk.Style()
        style.theme_use('clam')
        
        main_frame = ttk.Frame(self.root, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        ttk.Label(main_frame, text="Customer Name", font=('Segoe UI', 10, 'bold')).pack(anchor=tk.W, pady=(0, 5))
        self.customer_var = tk.StringVar()
        ttk.Entry(main_frame, textvariable=self.customer_var, width=40).pack(fill=tk.X, pady=(0, 15))
        
        ttk.Label(main_frame, text="Hardware ID", font=('Segoe UI', 10, 'bold')).pack(anchor=tk.W, pady=(0, 5))
        self.hardware_var = tk.StringVar()
        ttk.Entry(main_frame, textvariable=self.hardware_var, width=40).pack(fill=tk.X, pady=(0, 15))
        
        ttk.Label(main_frame, text="Edition", font=('Segoe UI', 10, 'bold')).pack(anchor=tk.W, pady=(0, 5))
        self.edition_var = tk.StringVar(value="Professional")
        edition_combo = ttk.Combobox(main_frame, textvariable=self.edition_var, values=["Professional", "Lite", "Enterprise"], state="readonly")
        edition_combo.pack(fill=tk.X, pady=(0, 25))
        
        generate_btn = ttk.Button(main_frame, text="Generate License", command=self.generate_license)
        generate_btn.pack(fill=tk.X, ipady=5)

    def load_private_key(self):
        if not self.private_key_path.exists():
            raise FileNotFoundError("private.pem not found. Run key_generator.py first.")
        with open(self.private_key_path, 'rb') as f:
            return rsa.PrivateKey.load_pkcs1(f.read())

    def generate_license(self):
        customer = self.customer_var.get().strip()
        hardware_id = self.hardware_var.get().strip()
        edition = self.edition_var.get().strip()
        
        if not customer or not hardware_id:
            messagebox.showerror("Error", "Please fill in all fields.")
            return
            
        try:
            priv_key = self.load_private_key()
            
            payload = {
                "customer_name": customer,
                "hardware_id": hardware_id,
                "edition": edition,
                "issue_date": date.today().isoformat(),
                "version": "1.0"
            }
            
            # Serialize deterministically
            payload_str = json.dumps(payload, separators=(',', ':'), sort_keys=True)
            
            # Sign the payload
            signature = rsa.sign(payload_str.encode('utf-8'), priv_key, 'SHA-256')
            signature_b64 = base64.b64encode(signature).decode('utf-8')
            
            # Final output structure
            license_data = {
                "payload": payload,
                "signature": signature_b64
            }
            
            output_path = self.script_dir / 'license.lic'
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(license_data, f, indent=4)
                
            messagebox.showinfo("Success", f"License generated successfully!\n\nSaved to: {output_path}")
            
            # Reset fields
            self.customer_var.set("")
            self.hardware_var.set("")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to generate license: {str(e)}")

if __name__ == "__main__":
    root = tk.Tk()
    app = LicenseGeneratorApp(root)
    root.mainloop()
