import { RunView } from '@/modules/gs-migration';

export default async function GsMigrationRunPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <RunView runId={decodeURIComponent(id)} />;
}
