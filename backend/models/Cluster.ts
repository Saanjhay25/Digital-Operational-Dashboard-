import mongoose from 'mongoose';

const clusterSchema = new mongoose.Schema({
    clusterId: { type: String, required: true },
    name: { type: String, required: true },
    nodes: { type: Number, required: true },
    health: { type: String, required: true },
    cpu: { type: Number, required: true },
    ram: { type: Number, required: true }
}, {
    timestamps: true
});

const Cluster = mongoose.model('Cluster', clusterSchema);

export default Cluster;
