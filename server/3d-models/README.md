# 3D Models
This folder contains 3D models of neurons and active zones, exported and processed using a combination of VAST, Blender, and ZBrush. Below is a step-by-step guide to how these models were created and exported.
## Exporting and Processing Steps
1. **Exported Segmentations from VAST:**
   - The neurons and active zones were segmented using VAST.
   - These segmentations were then exported as 3D meshes `.obj` format for further processing.
2. **Imported Models into Blender:**
   - The exported 3D meshes were imported into Blender for further processing.
3. **Smoothing and Coloring:**
   - The imported models were smoothed using tools in Blender and ZBrush.
4. **Exported in .STL Format:**
   - After processing, all the models were exported from Blender in `.stl` format.
## Obtaining Synapse Coordinates
- The coordinates of synapses are stored within the `.stl` files themselves.
- To extract these coordinates, the `.stl` files can be read using a Python or JavaScript package.
- The prototype deployed on AWS by Dylan uses the [parse-stl](https://github.com/thibauts/parse-stl) package to parse `.stl` files:
  - This package provides a list of vertex positions that represent the 3D object, formatted as `[[x1, y1, z1], [x2, y2, z2], ...]`.
  - For obtaining a single representative position, the middle coordinate of this list can be used.
- Examples of the actual `.stl` model files containing these coordinates can be found in the repository:
  - [3D Models Folder](https://github.com/zhenlab-ltri/catmaid-data-explorer/tree/3d-viewer/server/3d-models)
  - [Sample Model](https://github.com/zhenlab-ltri/catmaid-data-explorer/blob/3d-viewer/server/3d-models/ADAL-SEM_adult.stl)
  - [Synapses](https://github.com/zhenlab-ltri/catmaid-data-explorer/tree/3d-viewer/server/3d-models/synapses)
