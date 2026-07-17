import AppLayout from "@/layout/AppLayout";
import { Head } from "@inertiajs/react";
import { ReactElement, ReactNode } from "react";


const Profile: InertiaPageWithLayout = () => {
  return (
    <>
      <Head title="Profil & Pengaturan" />
    </>
  );
};

Profile.layout = (page: ReactNode) => <AppLayout title="Profil">{page}</AppLayout>;

export default Profile;
