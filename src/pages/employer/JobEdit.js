import { useParams } from "react-router-dom";
import JobForm from "@/components/JobForm";

export default function JobEdit() {
  const { jobId } = useParams();
  return <JobForm mode="edit" jobId={jobId} />;
}
