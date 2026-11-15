using UnrealBuildTool;
public class AfterSchoolDuelNativeEditorTarget : TargetRules {
 public AfterSchoolDuelNativeEditorTarget(TargetInfo Target):base(Target) {
  Type=TargetType.Editor;
  DefaultBuildSettings=BuildSettingsVersion.V7;
  IncludeOrderVersion=EngineIncludeOrderVersion.Unreal5_8;
  ExtraModuleNames.Add("ASDCNativePlay");
 }
}
