
import 'regenerator-runtime/runtime';
import { CATMAID_URL } from '../../config.json';


const exportGapJunctions = async (projectId: number) => {
  const projects = await fetch(`api/projects`).then(res => res.json());
  const connectors = await fetch(`api/gap-junctions?projectId=${projectId}`).then(res => res.json());
  const annotations = await fetch(`api/annotations?projectId=${projectId}`).then(res => res.json());

  const projectInfo = projects.find(p => p.id === projectId);

  const catmaidConnectorLinkMap = {};
  connectors.connectors.forEach(c => {
    const [id, x, y, z ] = c;
    catmaidConnectorLinkMap[id] = `${CATMAID_URL}/?pid=${projectInfo.id}&zp=${z}&yp=${y}&xp=${x}&tool=tracingtool&sid0=${projectInfo.stacks[0].id}&s0=0`;
  });

  const partnerIdNameMap = {};
  annotations.entities.filter(e => e.type === 'neuron').forEach(e => {
    partnerIdNameMap[e.skeleton_ids[0]] = e.name;
  });


  return Object.entries(connectors.partners).map(([id, partners]) => {
    const [, , partner0Id, , partner0Confidence] = partners[0];
    const [, , partner1Id, , partner1Confidence] = partners[1];

    return {
      id,
      partners: [partnerIdNameMap[partner0Id], partnerIdNameMap[partner1Id]],
      confidences: [partner0Confidence, partner1Confidence],
      catmaid_link: catmaidConnectorLinkMap[id],
      weight: 1
    };
  });
};



exportGapJunctions(188).then(r => {
  console.log(r);
});