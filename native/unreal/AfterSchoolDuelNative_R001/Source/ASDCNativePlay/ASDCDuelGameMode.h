#pragma once
#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "ASDCDuelGameMode.generated.h"
class ASkeletalMeshActor;
class USkeletalMesh;
class USkeletalMeshComponent;
class UAnimationAsset;
class UAnimSequence;
class ACameraActor;
UCLASS()
class ASDCNATIVEPLAY_API AASDCDuelGameMode : public AGameModeBase {
 GENERATED_BODY()
public:
 AASDCDuelGameMode();
 virtual void StartPlay() override;
 virtual void Tick(float DeltaSeconds) override;
 UFUNCTION(BlueprintCallable,Category="Duel") void PlayCard(int32 CardIndex);
 UPROPERTY(BlueprintReadOnly,Category="Duel") int32 PlayerHP=20;
 UPROPERTY(BlueprintReadOnly,Category="Duel") int32 OpponentHP=20;
 UPROPERTY(BlueprintReadOnly,Category="Duel") int32 Shield=0;
 UPROPERTY(BlueprintReadOnly,Category="Duel") int32 Turn=1;
 UPROPERTY(BlueprintReadOnly,Category="Duel") bool bInAction=false;
 UPROPERTY(BlueprintReadOnly,Category="Duel") FString StatusLine=TEXT("Preparing stage");
 UPROPERTY(BlueprintReadOnly,Category="Duel") FString OutcomeLine=TEXT("");
 UPROPERTY(BlueprintReadOnly,Category="Duel") bool bLoadedActors=false;
private:
 UPROPERTY() TObjectPtr<ASkeletalMeshActor> Teacher;
 UPROPERTY() TObjectPtr<ASkeletalMeshActor> Aunt;
 UPROPERTY() TObjectPtr<ACameraActor> StageCamera;
 UPROPERTY() TObjectPtr<UAnimSequence> TeacherIdle;
 UPROPERTY() TObjectPtr<UAnimSequence> TeacherWave;
 UPROPERTY() TObjectPtr<UAnimSequence> TeacherPunch;
 UPROPERTY() TObjectPtr<UAnimSequence> TeacherHit;
 UPROPERTY() TObjectPtr<UAnimSequence> TeacherCheer;
 UPROPERTY() TObjectPtr<UAnimSequence> AuntIdle;
 UPROPERTY() TObjectPtr<UAnimSequence> AuntThrow;
 UPROPERTY() TObjectPtr<UAnimSequence> AuntAngry;
 UPROPERTY() TObjectPtr<UAnimSequence> AuntCheer;
 FTimerHandle BattleTimer;
 FTimerHandle IdleTimer;
 FTimerHandle SmokeTimer;
 int32 PendingCard=0;
 int32 SmokeStep=0;
 float ProfileWindowTime=0;
 int32 ProfileFrames=0;
 float ProfileWorstFrameMs=0;

 void BuildArena();
 bool LoadActors();
 void ApplyPlayerAttack();
 void BeginAuntCounter();
 void ResolveAuntCounter();
 void ResetIdle();
 void RunSmokeStep();
 void PlayTeacher(UAnimSequence* Anim, bool bLoop);
 void PlayAunt(UAnimSequence* Anim, bool bLoop);
 void FinishMatch(bool bPlayerWon);
};
