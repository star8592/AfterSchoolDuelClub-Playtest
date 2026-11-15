#include "ASDCDuelGameMode.h"
#include "ASDCDuelHUD.h"
#include "ASDCDuelPlayerController.h"
#include "Animation/AnimSequence.h"
#include "Camera/CameraActor.h"
#include "Camera/CameraComponent.h"
#include "Components/SkeletalMeshComponent.h"
#include "Components/LightComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Engine/DirectionalLight.h"
#include "Engine/PointLight.h"
#include "Engine/SkyLight.h"
#include "Engine/StaticMeshActor.h"
#include "Engine/SkeletalMesh.h"
#include "Animation/SkeletalMeshActor.h"
#include "Engine/World.h"
#include "GameFramework/PlayerController.h"
#include "Kismet/KismetMathLibrary.h"
#include "Misc/CommandLine.h"
#include "Misc/Parse.h"
#include "TimerManager.h"
DEFINE_LOG_CATEGORY_STATIC(LogASDCDuel,Log,All);
namespace ASDCAssets{
static const TCHAR* TeacherMesh=TEXT("/Game/ASDCCharacterQA/MusicTeacher/M01-Maestro-Burgundy-Coat-STUDY/SkeletalMeshes/M01-Maestro-Burgundy-Coat-STUDY");
static const TCHAR* AuntMesh=TEXT("/Game/ASDCNativeMerged/M02/M02-CafeteriaAunt-ONE-SKIN-ALL-DETAILS/SkeletalMeshes/M02-CafeteriaAunt-ONE-SKIN-ALL-DETAILS");
static const TCHAR* TA=TEXT("/Game/ASDCCharacterQA/MusicTeacher/M01-Maestro-Burgundy-Coat-STUDY/SkeletalMeshes/");
static const TCHAR* AA=TEXT("/Game/ASDCNativeMerged/M02/M02-CafeteriaAunt-ONE-SKIN-ALL-DETAILS/SkeletalMeshes/");
}
AASDCDuelGameMode::AASDCDuelGameMode(){
 PrimaryActorTick.bCanEverTick=true;
 HUDClass=AASDCDuelHUD::StaticClass();
 PlayerControllerClass=AASDCDuelPlayerController::StaticClass();
 DefaultPawnClass=nullptr;
}
void AASDCDuelGameMode::Tick(float Dt){
 Super::Tick(Dt);
 if(Dt>0&&Dt<1.f){
  ProfileWindowTime+=Dt;ProfileFrames++;
  ProfileWorstFrameMs=FMath::Max(ProfileWorstFrameMs,Dt*1000.f);
  if(ProfileWindowTime>=5.f){
   UE_LOG(LogASDCDuel,Display,TEXT("ASDC_NATIVE_PERF fps=%.2f worst_ms=%.2f frames=%d window_s=%.1f"),
    ProfileFrames/ProfileWindowTime,ProfileWorstFrameMs,ProfileFrames,ProfileWindowTime);
   ProfileWindowTime=0;ProfileFrames=0;ProfileWorstFrameMs=0;
  }
 }
}
void AASDCDuelGameMode::BuildArena(){
 UWorld* World=GetWorld();
 auto* Cube=LoadObject<UStaticMesh>(nullptr,TEXT("/Engine/BasicShapes/Cube"));
 auto Prop=[&](const FVector& Loc,const FVector& Scale){
  if(!Cube)return;
  AStaticMeshActor* Actor=World->SpawnActor<AStaticMeshActor>(Loc,FRotator::ZeroRotator);
  if(!Actor)return;
  Actor->GetStaticMeshComponent()->SetStaticMesh(Cube);
  Actor->SetActorScale3D(Scale);
  Actor->GetStaticMeshComponent()->SetCollisionEnabled(ECollisionEnabled::QueryAndPhysics);
 };
 Prop(FVector(0,0,-50),FVector(14,10,1));
 Prop(FVector(320,0,155),FVector(.25,10,3.1));
 Prop(FVector(0,-495,55),FVector(14,.12,1.1));
 Prop(FVector(0,495,55),FVector(14,.12,1.1));
 Prop(FVector(100,-200,-10),FVector(2.0,2.0,.25));
 Prop(FVector(100,200,-10),FVector(2.0,2.0,.25));
 auto* Sun=World->SpawnActor<ADirectionalLight>(FVector(0,0,600),FRotator(-55,-20,0));
 if(Sun)Sun->GetLightComponent()->SetIntensity(6.0f);
 auto* Fill=World->SpawnActor<APointLight>(FVector(-150,0,370),FRotator::ZeroRotator);
 if(Fill){Fill->GetLightComponent()->SetIntensity(18000.f);}
 StageCamera=World->SpawnActor<ACameraActor>(FVector(-720,0,370),FRotator::ZeroRotator);
 if(StageCamera){
  StageCamera->SetActorRotation(UKismetMathLibrary::FindLookAtRotation(StageCamera->GetActorLocation(),FVector(0,0,137)));
  StageCamera->GetCameraComponent()->SetFieldOfView(65.f);
  if(auto* PC=World->GetFirstPlayerController())PC->SetViewTarget(StageCamera);
 }
}
bool AASDCDuelGameMode::LoadActors(){
 USkeletalMesh* M01=LoadObject<USkeletalMesh>(nullptr,ASDCAssets::TeacherMesh);
 USkeletalMesh* M02=LoadObject<USkeletalMesh>(nullptr,ASDCAssets::AuntMesh);
 if(!M01||!M02){
  UE_LOG(LogASDCDuel,Error,TEXT("ASDC_ASSET_MISSING M01=%d M02=%d"),M01!=nullptr,M02!=nullptr);
  return false;
 }
 Teacher=GetWorld()->SpawnActor<ASkeletalMeshActor>(FVector(0,-190,0),FRotator(0,0,0));
 Aunt=GetWorld()->SpawnActor<ASkeletalMeshActor>(FVector(0,190,0),FRotator(0,180,0));
 if(!Teacher||!Aunt)return false;
 Teacher->GetSkeletalMeshComponent()->SetSkeletalMeshAsset(M01);
 Aunt->GetSkeletalMeshComponent()->SetSkeletalMeshAsset(M02);
 Teacher->GetSkeletalMeshComponent()->SetCollisionEnabled(ECollisionEnabled::NoCollision);
 Aunt->GetSkeletalMeshComponent()->SetCollisionEnabled(ECollisionEnabled::NoCollision);

 // M02's hat and ladle are now inside one skeletal mesh with 13 material primitives.
 // There is no reason to spawn 12 extra skeletal followers (R001b stalled).
 UE_LOG(LogASDCDuel,Display,TEXT("ASDC_M02_MERGED_CHARACTER_LOADED one_skin=1 accessory_primitive_groups=12"));

 auto TeacherAnim=[&](const TCHAR* Suffix){
  return LoadObject<UAnimSequence>(nullptr,*(FString(ASDCAssets::TA)+
   TEXT("M01-Maestro-Burgundy-Coat-STUDY")+Suffix));
 };
 auto AuntAnim=[&](const TCHAR* Suffix){
  return LoadObject<UAnimSequence>(nullptr,*(FString(ASDCAssets::AA)+
   TEXT("M02-CafeteriaAunt-ONE-SKIN-ALL-DETAILS")+Suffix));
 };
 TeacherIdle=TeacherAnim(TEXT("Idle"));
 TeacherWave=TeacherAnim(TEXT("Wave"));
 TeacherPunch=TeacherAnim(TEXT("Punch"));
 TeacherHit=TeacherAnim(TEXT("Hit_reaction"));
 TeacherCheer=TeacherAnim(TEXT("Cheer"));
 AuntIdle=AuntAnim(TEXT("Idle"));
 AuntThrow=AuntAnim(TEXT("Grip_and_Throw_Down"));
 AuntAngry=AuntAnim(TEXT("Angry_Stomp"));
 AuntCheer=AuntAnim(TEXT("Victory_Cheer"));
 PlayTeacher(TeacherIdle,true);
 PlayAunt(AuntIdle,true);
 UE_LOG(LogASDCDuel,Display,TEXT("ASDC_NATIVE_ACTORS_READY M01=highdetail M02=merged13primitives M01_clips=%d M02_clips=%d"),
  (TeacherIdle&&TeacherWave&&TeacherPunch&&TeacherHit&&TeacherCheer)?5:0,
  (AuntIdle&&AuntThrow&&AuntAngry&&AuntCheer)?4:0);
 return TeacherIdle&&TeacherWave&&TeacherPunch&&TeacherHit&&TeacherCheer&&AuntIdle&&AuntThrow&&AuntAngry&&AuntCheer;
}
void AASDCDuelGameMode::PlayTeacher(UAnimSequence* Anim,bool bLoop){
 if(Teacher&&Anim)Teacher->GetSkeletalMeshComponent()->PlayAnimation(Anim,bLoop);
}
void AASDCDuelGameMode::PlayAunt(UAnimSequence* Anim,bool bLoop){
 if(Aunt&&Anim)Aunt->GetSkeletalMeshComponent()->PlayAnimation(Anim,bLoop);
}
void AASDCDuelGameMode::StartPlay(){
 Super::StartPlay();
 BuildArena();
 bLoadedActors=LoadActors();
 StatusLine=bLoadedActors?TEXT("Choose a card: 1 Sound Pulse / 2 Bookstorm / 3 Shield"):TEXT("ERROR: character assets unavailable");
 UE_LOG(LogASDCDuel,Display,TEXT("ASDC_NATIVE_START loaded=%d hp=%d:%d"),bLoadedActors,PlayerHP,OpponentHP);
 if(FParse::Param(FCommandLine::Get(),TEXT("ASDCShot"))&&bLoadedActors){
  FTimerHandle ScreenshotTimer;
  GetWorldTimerManager().SetTimer(ScreenshotTimer,FTimerDelegate::CreateLambda([this](){
    if(APlayerController* PC=GetWorld()->GetFirstPlayerController()){
      PC->ConsoleCommand(TEXT("HighResShot 1280x720"),true);
      UE_LOG(LogASDCDuel,Display,TEXT("ASDC_NATIVE_SCREENSHOT_REQUESTED"));
    }
  }),6.f,false);
 }
 if(FParse::Param(FCommandLine::Get(),TEXT("ASDCSmoke"))&&bLoadedActors){
  GetWorldTimerManager().SetTimer(SmokeTimer,this,&AASDCDuelGameMode::RunSmokeStep,1.0f,true,1.8f);
 }
}
void AASDCDuelGameMode::PlayCard(int32 CardIndex){
 if(!bLoadedActors||bInAction||PlayerHP<=0||OpponentHP<=0||CardIndex<0||CardIndex>2)return;
 PendingCard=CardIndex;
 bInAction=true;
 UE_LOG(LogASDCDuel,Display,TEXT("ASDC_CARD_PLAYED turn=%d card=%d hp=%d:%d"),
  Turn,CardIndex,PlayerHP,OpponentHP);
 if(CardIndex==2){
  Shield=FMath::Min(12,Shield+4);
  PlayTeacher(TeacherCheer,false);
  StatusLine=TEXT("STAGE SHIELD +4. Cafeteria Aunt is preparing a counter.");
  GetWorldTimerManager().SetTimer(BattleTimer,this,&AASDCDuelGameMode::BeginAuntCounter,.8f,false);
 }else{
  PlayTeacher(CardIndex==0?TeacherWave:TeacherPunch,false);
  StatusLine=CardIndex==0?TEXT("SOUND PULSE! Music teacher casts a rhythm attack."):
   TEXT("BOOKSTORM! A flying textbook strikes the opponent.");
  GetWorldTimerManager().SetTimer(BattleTimer,this,&AASDCDuelGameMode::ApplyPlayerAttack,.72f,false);
 }
}
void AASDCDuelGameMode::ApplyPlayerAttack(){
 int32 Damage=PendingCard==0?3:5;
 OpponentHP=FMath::Max(0,OpponentHP-Damage);
 PlayAunt(AuntAngry,false);
 UE_LOG(LogASDCDuel,Display,TEXT("ASDC_PLAYER_HIT damage=%d opponent_hp=%d"),Damage,OpponentHP);
 if(OpponentHP<=0){FinishMatch(true);return;}
 GetWorldTimerManager().SetTimer(BattleTimer,this,&AASDCDuelGameMode::BeginAuntCounter,1.0f,false);
}
void AASDCDuelGameMode::BeginAuntCounter(){
 StatusLine=TEXT("Cafeteria Aunt strikes back with a soup ladle!");
 PlayAunt(AuntThrow,false);
 GetWorldTimerManager().SetTimer(BattleTimer,this,&AASDCDuelGameMode::ResolveAuntCounter,1.0f,false);
}
void AASDCDuelGameMode::ResolveAuntCounter(){
 const int32 Raw=3;
 const int32 Blocked=FMath::Min(Raw,Shield);
 Shield-=Blocked;
 PlayerHP=FMath::Max(0,PlayerHP-(Raw-Blocked));
 PlayTeacher(TeacherHit,false);
 UE_LOG(LogASDCDuel,Display,TEXT("ASDC_AI_HIT damage=%d blocked=%d player_hp=%d shield=%d"),Raw-Blocked,Blocked,PlayerHP,Shield);
 if(PlayerHP<=0){FinishMatch(false);return;}
 ++Turn;
 StatusLine=FString::Printf(TEXT("Turn %d. Choose another card (1/2/3)."),Turn);
 GetWorldTimerManager().SetTimer(IdleTimer,this,&AASDCDuelGameMode::ResetIdle,.8f,false);
 bInAction=false;
}
void AASDCDuelGameMode::ResetIdle(){PlayTeacher(TeacherIdle,true);PlayAunt(AuntIdle,true);}
void AASDCDuelGameMode::FinishMatch(bool bPlayerWon){
 bInAction=true;
 OutcomeLine=bPlayerWon?TEXT("MUSIC TEACHER WINS!"):TEXT("CAFETERIA AUNT WINS!");
 StatusLine=TEXT("Match complete.");
 if(bPlayerWon)PlayTeacher(TeacherCheer,false);
 else PlayAunt(AuntCheer,false);
 UE_LOG(LogASDCDuel,Display,TEXT("ASDC_MATCH_FINISHED winner=%s turn=%d hp=%d:%d"),
  bPlayerWon?TEXT("M01"):TEXT("M02"),Turn,PlayerHP,OpponentHP);
 GetWorldTimerManager().ClearTimer(SmokeTimer);
}
void AASDCDuelGameMode::RunSmokeStep(){
 if(bInAction)return;
 static const int32 Sequence[]={0,2,1,0,1,0,2,1,0,1,1};
 const int32 Count=UE_ARRAY_COUNT(Sequence);
 if(SmokeStep>=Count){GetWorldTimerManager().ClearTimer(SmokeTimer);return;}
 PlayCard(Sequence[SmokeStep++]);
}
