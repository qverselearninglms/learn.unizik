import { PayView } from '@/modules/gs-registration';

/** Payment summary + gateway wrapper; also the gateway's return (callback) URL. */
export default function GsPayPage() {
    return <PayView />;
}
