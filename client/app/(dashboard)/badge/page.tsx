import { redirect } from 'next/navigation';

/** Badge inventory was removed — thermal badges print at check-in. */
export default function BadgePage() {
   redirect('/visits');
}
