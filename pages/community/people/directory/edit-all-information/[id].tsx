import { Modal, Stack } from "@mui/material";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { type NextPage } from "next/types";
import { useCallback, useEffect, useState } from "react";

import IndividualEmployeeTimeReportSection from "~community/attendance/components/molecules/IndividualEmployeeTimeReportBody/IndividualEmployeeTimeReportBody";
import { useUploadImages } from "~community/common/api/FileHandleApi";
import BoxStepper from "~community/common/components/molecules/BoxStepper/BoxStepper";
import ToastMessage from "~community/common/components/molecules/ToastMessage/ToastMessage";
import ContentLayout from "~community/common/components/templates/ContentLayout/ContentLayout";
import { ZIndexEnums } from "~community/common/enums/CommonEnums";
import { ToastType } from "~community/common/enums/ComponentEnums";
import { useTranslator } from "~community/common/hooks/useTranslator";
import { useToast } from "~community/common/providers/ToastProvider";
import { AdminTypes } from "~community/common/types/AuthTypes";
import { EditAllInfoErrorTypes } from "~community/common/types/ErrorTypes";
import IndividualEmployeeLeaveReportSection from "~community/leave/components/molecules/IndividualEmployeeLeaveReportSection/IndividualEmployeeLeaveReportSection";
import { useHandleEditNewResource } from "~community/people/api/PeopleApi";
import DiscardChangeApprovalModal from "~community/people/components/molecules/DiscardChangeApprovalModal/DiscardChangeApprovalModal";
import EditAllInfoSkeleton from "~community/people/components/molecules/EditAllInfoSkeleton/EditAllInfoSkeleton";
import EditInfoCard from "~community/people/components/molecules/EditInfoCard/EditInfoCard";
import EditInfoCardSkeleton from "~community/people/components/molecules/EditInfoCard/EditInfoCardSkeleton";
import PeopleTimeline from "~community/people/components/molecules/PeopleTimeline/PeopleTimeline";
import TerminationModalController from "~community/people/components/molecules/TerminationModalController/TerminationModalController";
import EmergencyDetailsForm from "~community/people/components/organisms/AddNewResourceFlow/EmergencyDetailsSection/EmergencyDetailsForm";
import EmploymentDetailsForm from "~community/people/components/organisms/AddNewResourceFlow/EmploymentDetailsSection/EmploymentDetailsForm";
import PersonalDetailsForm from "~community/people/components/organisms/AddNewResourceFlow/PersonalDetailsSection/PersonalDetailsForm";
import SystemPermissionForm from "~community/people/components/organisms/AddNewResourceFlow/SystemPermissionSection/SystemPermissionForm";
import {
  AccountStatusEnums,
  DiscardTypeEnums
} from "~community/people/enums/editResourceEnums";
import useDetectChange from "~community/people/hooks/useDetectChange";
import useGetEmployee from "~community/people/hooks/useGetEmployee";
import { usePeopleStore } from "~community/people/store/store";
import { EmployeeType } from "~community/people/types/AddNewResourceTypes";
import {
  DiscardChangeModalType,
  EditAllInformationFormStatus,
  EditAllInformationType
} from "~community/people/types/EditEmployeeInfoTypes";
import {
  EmployeeDetails,
  contractStates
} from "~community/people/types/EmployeeTypes";
import { superAdminRedirectSteps } from "~community/people/utils/addNewResourceFunctions";

const EditAllInformation: NextPage = () => {
  const router = useRouter();
  const { setToastMessage, toastMessage } = useToast();
  const translateText = useTranslator("peopleModule");
  const { data } = useSession();

  const isPeopleAdmin = data?.user.roles?.includes(AdminTypes.PEOPLE_ADMIN);

  const translateToastText = useTranslator(
    "peopleModule",
    "addResource",
    "commonText"
  );
  const translateErrors = useTranslator(
    "peopleModule",
    "editAllInfo.editAllInfoErrors"
  );

  const isAdmin = data?.user.roles?.includes(
    AdminTypes.SUPER_ADMIN ||
      AdminTypes.PEOPLE_ADMIN ||
      AdminTypes.LEAVE_ADMIN ||
      AdminTypes.ATTENDANCE_ADMIN
  );

  const {
    employeeGeneralDetails,
    employeeContactDetails,
    employeeFamilyDetails,
    employeeEducationalDetails,
    employeeSocialMediaDetails,
    employeeHealthAndOtherDetails,
    employeeEmergencyContactDetails,
    employeeEmploymentDetails,
    employeeCareerDetails,
    employeeIdentificationAndDiversityDetails,
    employeePreviousEmploymentDetails,
    employeeVisaDetails,
    employeeDataChanges,
    userRoles,
    setEmployeeGeneralDetails
  } = usePeopleStore((state) => state);

  const { id, tab } = router.query;

  const {
    employee,
    isSuccess,
    setEmployeeData,
    refetchEmployeeData,
    discardEmployeeData
  }: {
    employee: EmployeeDetails | undefined;
    isSuccess: boolean;
    setEmployeeData: () => void;
    refetchEmployeeData: () => Promise<void>;
    discardEmployeeData: () => void;
  } = useGetEmployee({ id: Number(id) });

  const { isValuesChanged } = useDetectChange({ id: Number(id) });

  const [isSuperAdminEditFlow, setIsSuperAdminEditFlow] = useState(false);
  const [_, setHasUploadStarted] = useState(false);
  const [formType, setFormType] = useState<EditAllInformationType>(
    EditAllInformationType.personal
  );

  const [updateEmployeeStatus, setUpdateEmployeeStatus] =
    useState<EditAllInformationFormStatus>(
      EditAllInformationFormStatus.PENDING
    );

  const [isDiscardChangesModal, setIsDiscardChangesModal] =
    useState<DiscardChangeModalType>({
      isModalOpen: false,
      modalType: "",
      modalOpenedFrom: ""
    });

  const [isProbation, setIsProbation] = useState<boolean>(
    (employee?.contractState === contractStates.PROBATION &&
      Boolean(employee?.periodResponseDto)) ||
      false
  );

  const steps = [
    translateText(["editAllInfo", "personal"]),
    translateText(["editAllInfo", "emergency"]),
    translateText(["editAllInfo", "employment"]),
    translateText(["editAllInfo", "systemPermissions"]),
    translateText(["editAllInfo", "timeline"]),
    translateText(["editAllInfo", "leave"]),
    translateText(["editAllInfo", "timesheet"])
  ];

  const setSuperAdminIncompleteToasts = () => {
    let toastMessageDescription = "";
    const formType = superAdminRedirectSteps(
      employeeGeneralDetails,
      employeeContactDetails,
      employeeEmergencyContactDetails,
      employeeEmploymentDetails
    );
    if (formType === EditAllInformationType.personal) {
      toastMessageDescription = translateToastText([
        "incompleteSuperAdminToastDescriptionPersonal"
      ]);
    }
    if (formType === EditAllInformationType.emergency) {
      toastMessageDescription = translateToastText([
        "incompleteSuperAdminToastDescriptionEmergency"
      ]);
    }
    if (formType === EditAllInformationType.employment) {
      toastMessageDescription = translateToastText([
        "incompleteSuperAdminToastDescriptionEmployment"
      ]);
    }
    setToastMessage({
      toastType: ToastType.WARN,
      title: translateToastText(["incompleteSuperAdminToastTitle"]),
      description: toastMessageDescription,
      open: true
    });
  };

  const onSuccess = async () => {
    if (isDiscardChangesModal.isModalOpen) {
      setUpdateEmployeeStatus(EditAllInformationFormStatus.UPDATED);
    } else {
      setUpdateEmployeeStatus(EditAllInformationFormStatus.PENDING);
    }

    await refetchEmployeeData();

    if (isAdmin) {
      const redirectStep = superAdminRedirectSteps(
        employeeGeneralDetails,
        employeeContactDetails,
        employeeEmergencyContactDetails,
        employeeEmploymentDetails
      );

      if (
        redirectStep &&
        isDiscardChangesModal?.modalType !== DiscardTypeEnums.LEAVE_TAB
      ) {
        setSuperAdminIncompleteToasts();
        setToastMessage({
          toastType: ToastType.SUCCESS,
          title: translateToastText(["editToastTitle"]),
          description: translateToastText(["editToastDescription"]),
          open: true
        });
        setFormType(redirectStep);
        return;
      }
    }

    setToastMessage({
      toastType: ToastType.SUCCESS,
      title: translateToastText(["editToastTitle"]),
      description: translateToastText(["editToastDescription"]),
      open: true
    });
  };

  const onError = (error: string) => {
    setUpdateEmployeeStatus(EditAllInformationFormStatus.UPDATE_ERROR);
    const toastContent = {
      toastType: ToastType.ERROR,
      title: translateErrors(["title"]),
      description: translateErrors(["description"], {
        employee: employee?.name ?? translateErrors(["employee"])
      }),
      open: true
    };
    const errors = {
      [EditAllInfoErrorTypes.REALOCATE_INDIVIDUAL_SUPERVISOR_ERROR]:
        translateErrors(["realocateIndividualSupervisorError"]),
      [EditAllInfoErrorTypes.REALOCATE_TEAM_SUPERVISOR_ERROR]: translateErrors([
        "realocateTeamSupervisorError"
      ]),
      [EditAllInfoErrorTypes.REALOCATE_INIDIVIDUAL_AND_TEAM_SUPERVISOR_ERROR]:
        translateErrors(["realocateIndividualAndTeamSupervisorError"]),
      [EditAllInfoErrorTypes.UPLOAD_PROFILE_PICTURE_ERROR]: translateErrors([
        "uploadError"
      ])
    };
    toastContent.description =
      errors[error as EditAllInfoErrorTypes] ?? toastContent.description;
    setToastMessage(toastContent);
  };

  const {
    mutate,
    isPending: isEditingEmployeeLoading,
    isSuccess: isEditingEmployeeSuccess
  } = useHandleEditNewResource(onSuccess, onError);

  const { mutateAsync: imageUploadMutate } = useUploadImages();

  const handleBackBtnClick = () =>
    isValuesChanged() && isSuccess && !isDiscardChangesModal.isModalOpen
      ? setIsDiscardChangesModal({
          isModalOpen: true,
          modalType: DiscardTypeEnums.LEAVE_FORM,
          modalOpenedFrom: formType
        })
      : router.back();

  const handleCancelBtnClick = () => {
    if (isValuesChanged() && isSuccess) {
      setIsDiscardChangesModal({
        isModalOpen: true,
        modalType: DiscardTypeEnums.CANCEL_FORM,
        modalOpenedFrom: formType
      });
    }
  };

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isValuesChanged()) {
      e.preventDefault();
      return "";
    }
  };

  const handleRouteChange = () => {
    if (isValuesChanged() && !isDiscardChangesModal.isModalOpen) {
      setIsDiscardChangesModal({
        isModalOpen: true,
        modalType: DiscardTypeEnums.LEAVE_FORM,
        modalOpenedFrom: formType
      });
      router.events.emit("routeChangeError");
      throw "routeChange aborted";
    }
  };

  useEffect(() => {
    router.events.on("routeChangeStart", handleRouteChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      router.events.off("routeChangeStart", handleRouteChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [handleRouteChange, handleBeforeUnload]);

  const handleComponentChange = (step: EditAllInformationType) => {
    if (isValuesChanged() && isSuccess) {
      setIsDiscardChangesModal({
        isModalOpen: true,
        modalType: DiscardTypeEnums.LEAVE_TAB,
        modalOpenedFrom: step
      });
    } else {
      setFormType(step);
    }
  };

  const handleSave = async () => {
    let newAuthPicURL = "";
    if (
      typeof employeeGeneralDetails?.authPic === "object" &&
      employeeGeneralDetails?.authPic &&
      employeeGeneralDetails?.authPic?.length > 0
    ) {
      try {
        setHasUploadStarted(true);
        const formData = new FormData();
        formData.append("file", employeeGeneralDetails?.authPic[0]);

        formData.append("type", "USER_IMAGE");

        await imageUploadMutate(formData).then((response) => {
          const filePath = response.message?.split(
            "File uploaded successfully: "
          )[1];
          if (filePath) {
            const fileName = filePath.split("/").pop();
            if (fileName) {
              newAuthPicURL = fileName;
            }
          }
        });
        setHasUploadStarted(false);
      } catch (error) {
        onError(EditAllInfoErrorTypes.UPLOAD_PROFILE_PICTURE_ERROR);
      }
    } else {
      newAuthPicURL = (employeeGeneralDetails?.authPic as string) ?? "";
    }

    setEmployeeGeneralDetails("authPic", newAuthPicURL);
    const updatedEmployeeData: EmployeeType = {
      employeeId: employee?.employeeId as string,
      generalDetails: {
        ...employeeGeneralDetails,
        authPic: newAuthPicURL
      },
      contactDetails: employeeContactDetails,
      familyDetails: employeeFamilyDetails,
      educationalDetails: employeeEducationalDetails,
      socialMediaDetails: employeeSocialMediaDetails,
      healthAndOtherDetails: employeeHealthAndOtherDetails,
      emergencyDetails: employeeEmergencyContactDetails,
      employmentDetails: employeeEmploymentDetails,
      careerDetails: employeeCareerDetails,
      identificationAndDiversityDetails:
        employeeIdentificationAndDiversityDetails,
      previousEmploymentDetails: employeePreviousEmploymentDetails,
      visaDetails: employeeVisaDetails,
      userRoles: userRoles
    };

    if (isAdmin) {
      setIsSuperAdminEditFlow(true);
    }
    mutate(updatedEmployeeData);
  };

  const isInputsDisabled =
    employee?.employmentStatus ===
      AccountStatusEnums.TERMINATED.toUpperCase() || !isPeopleAdmin;

  const getComponent = useCallback(() => {
    switch (formType) {
      case EditAllInformationType.personal:
        return (
          <PersonalDetailsForm
            onNext={handleSave}
            onBack={handleCancelBtnClick}
            isUpdate
            isSubmitDisabled={!isValuesChanged()}
            isLoading={false}
            updateEmployeeStatus={updateEmployeeStatus}
            setUpdateEmployeeStatus={setUpdateEmployeeStatus}
            isSuperAdminEditFlow={
              isSuperAdminEditFlow &&
              superAdminRedirectSteps(
                employeeGeneralDetails,
                employeeContactDetails,
                employeeEmergencyContactDetails,
                employeeEmploymentDetails
              ) !== null
            }
            isInputsDisabled={isInputsDisabled}
          />
        );
      case EditAllInformationType.emergency:
        return (
          <EmergencyDetailsForm
            onNext={handleSave}
            onBack={handleCancelBtnClick}
            isUpdate
            isSubmitDisabled={!isValuesChanged()}
            isLoading={false}
            updateEmployeeStatus={updateEmployeeStatus}
            setUpdateEmployeeStatus={setUpdateEmployeeStatus}
            isSuperAdminEditFlow={
              isSuperAdminEditFlow &&
              superAdminRedirectSteps(
                employeeGeneralDetails,
                employeeContactDetails,
                employeeEmergencyContactDetails,
                employeeEmploymentDetails
              ) !== null
            }
            isInputsDisabled={isInputsDisabled}
          />
        );
      case EditAllInformationType.employment:
        return (
          <EmploymentDetailsForm
            onNext={handleSave}
            onBack={handleCancelBtnClick}
            isUpdate
            isSubmitDisabled={!isValuesChanged()}
            isLoading={false}
            updateEmployeeStatus={updateEmployeeStatus}
            setUpdateEmployeeStatus={setUpdateEmployeeStatus}
            isSuperAdminEditFlow={
              isSuperAdminEditFlow &&
              superAdminRedirectSteps(
                employeeGeneralDetails,
                employeeContactDetails,
                employeeEmergencyContactDetails,
                employeeEmploymentDetails
              ) !== null
            }
            isInputsDisabled={isInputsDisabled}
          />
        );
      case EditAllInformationType.permission:
        return (
          <SystemPermissionForm
            onBack={handleCancelBtnClick}
            onNext={handleSave}
            onSave={handleSave}
            isLoading={false}
            isUpdate
            isSuccess={isSuccess}
            employee={employee}
            isInputsDisabled={isInputsDisabled}
          />
        );
      case EditAllInformationType.timeline:
        return <PeopleTimeline id={id ?? ""} />;
      case EditAllInformationType.leave:
        return (
          <IndividualEmployeeLeaveReportSection
            selectedUser={Number(id)}
            employeeLastName={employee?.lastName}
            employeeFirstName={employee?.firstName}
          />
        );
      case EditAllInformationType.timesheeet:
        return (
          <IndividualEmployeeTimeReportSection selectedUser={Number(id)} />
        );
      default:
        <PersonalDetailsForm
          onNext={handleSave}
          onBack={handleCancelBtnClick}
          isUpdate
          isSubmitDisabled={!isValuesChanged()}
          isLoading={false}
        />;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    employee,
    formType,
    id,
    isEditingEmployeeSuccess,
    isEditingEmployeeLoading,
    isProbation,
    handleBackBtnClick,
    mutate
  ]);

  useEffect(() => {
    setIsProbation(
      (employee?.contractState === contractStates.PROBATION &&
        Boolean(employee?.periodResponseDto)) ||
        false
    );
  }, [employee]);

  useEffect(() => {
    if (employeeDataChanges === 0 && employee) {
      setEmployeeData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee, employeeDataChanges]);

  useEffect(() => {
    return () => {
      discardEmployeeData();
      setIsSuperAdminEditFlow(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab && tab === "timesheet") {
      setFormType(EditAllInformationType.timesheeet);
    } else if (tab === "leave") {
      setFormType(EditAllInformationType.leave);
    }
  }, [tab]);

  return (
    <>
      <ContentLayout
        title={""}
        onBackClick={handleBackBtnClick}
        pageHead={""}
        isBackButtonVisible
      >
        <Stack direction={"column"}>
          {employee ? (
            <EditInfoCard selectedEmployee={employee} />
          ) : (
            <EditInfoCardSkeleton />
          )}
          <BoxStepper
            activeStep={formType}
            steps={steps}
            onStepClick={(step) =>
              handleComponentChange(step as EditAllInformationType)
            }
            useStringIdentifier
            stepperStyles={{
              marginBottom: "1.75rem"
            }}
            isFullWidth
          />
          {isSuccess ? getComponent() : <EditAllInfoSkeleton />}
        </Stack>
      </ContentLayout>
      <TerminationModalController />
      {isDiscardChangesModal.isModalOpen && (
        <Modal
          open={isDiscardChangesModal.isModalOpen}
          onClose={() => {
            setIsDiscardChangesModal({
              isModalOpen: false,
              modalType: "",
              modalOpenedFrom: ""
            });
            setUpdateEmployeeStatus(EditAllInformationFormStatus.PENDING);
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: ZIndexEnums.MAX
          }}
        >
          <DiscardChangeApprovalModal
            setFormType={setFormType}
            isDiscardChangesModal={isDiscardChangesModal}
            setIsDiscardChangesModal={setIsDiscardChangesModal}
            functionOnLeave={setEmployeeData}
            updateEmployeeStatus={updateEmployeeStatus}
            setUpdateEmployeeStatus={setUpdateEmployeeStatus}
          />
        </Modal>
      )}

      <ToastMessage
        open={toastMessage.open}
        onClose={toastMessage.onClose}
        title={toastMessage.title}
        description={toastMessage.description}
        toastType={toastMessage.toastType}
        autoHideDuration={toastMessage.autoHideDuration}
      />
    </>
  );
};

export default EditAllInformation;
