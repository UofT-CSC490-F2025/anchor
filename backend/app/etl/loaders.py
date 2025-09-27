from typing import Any, Dict
import os
import pickle

def save_to_disk(data: Dict[str, Any], output_dir: str = "./processed_data"):
    """
    Saves processed data to disk as a pickle file.
    Args:
        data (Dict): Data to save.
        output_dir (str): Directory to save data.
    """
    os.makedirs(output_dir, exist_ok=True)
    dataset_name = data.get('dataset', 'unknown')
    out_path = os.path.join(output_dir, f"{dataset_name}_processed.pkl")
    with open(out_path, 'wb') as f:
        pickle.dump(data, f)
    print(f"Saved processed data to {out_path}")

def default_loader(data: Any, **kwargs):
    print(f"Loaded dataset: {data}")
