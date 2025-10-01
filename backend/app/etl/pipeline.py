from typing import Callable, Dict, Any

class ETLPipeline:
    def __init__(self):
        self.importers = {}
        self.transformers = {}
        self.loaders = {}

    def register_importer(self, name: str, importer: Callable):
        self.importers[name] = importer

    def register_transformer(self, name: str, transformer: Callable):
        self.transformers[name] = transformer

    def register_loader(self, name: str, loader: Callable):
        self.loaders[name] = loader

    def run(self, dataset_name: str, import_args: Dict[str, Any], transform_args: Dict[str, Any], load_args: Dict[str, Any]):
        if dataset_name not in self.importers:
            raise ValueError(f"No importer registered for {dataset_name}")
        data = self.importers[dataset_name](**import_args)
        for t_name, t_func in self.transformers.items():
            data = t_func(data, **transform_args)
        for l_name, l_func in self.loaders.items():
            l_func(data, **load_args)
        return True
