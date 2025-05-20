
import React from "react";
import EventForm from "@/pages/admin/EventForm";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";

const CreatorEventForm = () => {
  const { user } = useAuth();
  
  return (
    <Layout>
      <div className="section-container">
        <h1 className="text-2xl font-bold mb-6">Manage Event</h1>
        <EventForm isCreator={true} creatorId={user?.id} />
      </div>
    </Layout>
  );
};

export default CreatorEventForm;
