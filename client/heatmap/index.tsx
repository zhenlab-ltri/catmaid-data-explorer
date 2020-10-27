
import 'regenerator-runtime/runtime';


const exportGapJunctions = async (projectId: number) => {
  const projects = await fetch(`api/projects`).then(res => res.json());
  const connectors = await fetch(`api/chemical-synapses?projectId=${projectId}`).then(res => res.json());
  const annotations = await fetch(`api/annotations?projectId=${projectId}`).then(res => res.json());

  console.log(projects, connectors, annotations);

  const projectInfo = projects.find(p => p.id === projectId);
  console.log(projectInfo);

  // const gapJunctions = Object.entries(connectors['partners']).map( ([gjId, gjPartners]) => {
  //   const neuron1Id = gjPartners[0][2];
  //   const neuron2Id = gjPartners[1][2];
  //   const neuron1Confidence = gjPartners[0][4];
  //   const neuron2Confidence = gjPartners[1][4];


  //   const gjData = {
  //     dataset:
  //   }



  // });
};

exportGapJunctions(200);